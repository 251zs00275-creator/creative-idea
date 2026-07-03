import { isIP } from 'node:net'
import { lookup } from 'node:dns/promises'

export class UnsafeUrlError extends Error {}

// 既知の残存リスク（個人利用アプリのリスクプロファイルとして許容）:
// - DNS rebinding: ここでのDNS解決結果と実際のfetch()時の解決結果が
//   異なる可能性がある（TOCTOU）。解決済みIPに接続を固定するには
//   カスタムundici Agentが必要だが、本アプリの規模には過剰。
// - 10進数/16進数IPリテラル(例: http://2130706433/)は isIP() が
//   falseを返すためDNS lookupにフォールバックするが、Node の
//   dns.lookup（=getaddrinfo）がOSレベルでこれらの表記を解決するため、
//   結果として下のIP判定に到達し引き続きブロックされる。

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])

/**
 * 外部URLへのサーバーサイドfetch前に呼ぶSSRFガード。
 * スキーム・ホスト名・DNS解決先IPを検証し、社内ネットワークや
 * クラウドメタデータエンドポイント（169.254.169.254等）への
 * アクセスを拒否する。
 */
export async function assertSafeUrl(rawUrl: string): Promise<void> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new UnsafeUrlError('URLの形式が不正です')
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new UnsafeUrlError('http/https以外のURLは指定できません')
  }

  const hostname = url.hostname.toLowerCase()

  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    throw new UnsafeUrlError('ローカルホストへのアクセスは許可されていません')
  }

  const literalIp = isIP(hostname) ? hostname : null

  const addresses = literalIp
    ? [literalIp]
    : (await lookup(hostname, { all: true })).map((a) => a.address)

  for (const address of addresses) {
    if (isPrivateOrReservedIp(address)) {
      throw new UnsafeUrlError('アクセスが許可されていないアドレスです')
    }
  }
}

/**
 * ループバック・リンクローカル(クラウドメタデータ含む)・プライベート・
 * その他予約済みIPレンジかどうかを判定する。
 */
function isPrivateOrReservedIp(address: string): boolean {
  if (isIP(address) === 4) {
    const octets = address.split('.').map(Number)
    const [a, b] = octets

    if (a === 127) return true // loopback
    if (a === 10) return true // private
    if (a === 172 && b >= 16 && b <= 31) return true // private
    if (a === 192 && b === 168) return true // private
    if (a === 169 && b === 254) return true // link-local / cloud metadata
    if (a === 0) return true // "this network"
    if (a >= 224) return true // multicast/reserved

    return false
  }

  if (isIP(address) === 6) {
    const normalized = address.toLowerCase()
    if (normalized === '::1') return true // loopback
    if (normalized.startsWith('fe80:')) return true // link-local
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true // unique local
    if (normalized.startsWith('::ffff:')) {
      // IPv4-mapped IPv6 — 内包するIPv4アドレスとして再判定
      return isPrivateOrReservedIp(normalized.replace('::ffff:', ''))
    }
    return false
  }

  return true // 解析できないものは安全側に倒して拒否
}
