import { FrameworkKey } from '@/types'

export interface FrameworkStep {
  id: string
  label: string
  question: string
  hints: string[]
}

export interface Framework {
  key: FrameworkKey
  name: string
  description: string
  steps: FrameworkStep[]
}

export const FRAMEWORKS: Record<FrameworkKey, Framework> = {
  vts: {
    key: 'vts',
    name: 'VTS',
    description: '観察→根拠→発見',
    steps: [
      {
        id: 'observation',
        label: '観察',
        question: 'この作品の中で、何が起きていますか？',
        hints: [
          '最初に目に入ったものは何ですか？',
          '色・形・動きで気になるものは？',
          '作品の中心にあるものは何ですか？',
          '背景や周辺に何がありますか？',
        ],
      },
      {
        id: 'evidence',
        label: '根拠',
        question: '「良い」と感じた。作品のどこからそう思いましたか？',
        hints: [
          'どの部分が特に印象的でしたか？',
          '色使いで惹かれたところは？',
          '構図や配置で気に入った点は？',
          '全体の雰囲気を作り出しているものは？',
        ],
      },
      {
        id: 'discovery',
        label: '発見',
        question: 'もっと発見はありますか？最初は気づかなかったことは？',
        hints: [
          '細部をじっくり見ると何が見えますか？',
          '最初の印象と変わったことはありますか？',
          '作品の外側（余白・枠）に気づいたことは？',
          '見るたびに新しく気づくことはありますか？',
        ],
      },
    ],
  },

  orid: {
    key: 'orid',
    name: 'ORID',
    description: '事実→感情→解釈→行動',
    steps: [
      {
        id: 'objective',
        label: '事実',
        question: '客観的に見えた・聞こえた事実は？',
        hints: [
          '色・形・音・動きを言葉にすると？',
          '登場するものや人物を挙げると？',
          '構成・順序はどうなっていましたか？',
        ],
      },
      {
        id: 'reflective',
        label: '感情',
        question: 'そのとき、どんな感情・身体反応があった？',
        hints: [
          '見ていて気持ちはどう動きましたか？',
          '身体的に感じたことは（心拍・息苦しさ等）？',
          '最も感情が動いた瞬間はいつですか？',
          '好き・嫌いの感情はどこから来ていますか？',
        ],
      },
      {
        id: 'interpretive',
        label: '解釈',
        question: 'なぜそう感じた？この作品は何を言っていると思う？',
        hints: [
          'なぜその感情が起きたと思いますか？',
          '作品が伝えようとしているメッセージは？',
          '自分の経験や価値観と重なる部分は？',
          '作者はどんな意図を持っていると思いますか？',
        ],
      },
      {
        id: 'decisional',
        label: '行動',
        question: 'この体験から、自分は何をしたい・変えたいと思った？',
        hints: [
          'この作品から何かを学べましたか？',
          '自分の制作や仕事に活かせることは？',
          '誰かに共有・推薦したいと思いますか？',
        ],
      },
    ],
  },

  element: {
    key: 'element',
    name: '要素分解',
    description: '制作意図を読む',
    steps: [
      {
        id: 'visual',
        label: '視覚的要素',
        question: '色・構図・光・形の中で特に際立つものは？',
        hints: [
          '主役の色は何色で、なぜその色だと思いますか？',
          '構図の中心はどこに置かれていますか？',
          '光の使い方で印象的なところは？',
          '形や線が感情に与える効果は？',
        ],
      },
      {
        id: 'tempo',
        label: '時間・テンポ',
        question: '間・リズム・展開の速さはどう機能している？',
        hints: [
          '展開の速さは感情にどう影響しましたか？',
          '静止・加速・減速はどこで使われていますか？',
          '余白（間）の使い方で印象的なところは？',
        ],
      },
      {
        id: 'omission',
        label: '省略・余白',
        question: 'あえて描かれていない・語られていないものは何？',
        hints: [
          '描かれていないのに感じるものは何ですか？',
          '余白が語っていることは？',
          '省略によって生まれる想像の余地はどこですか？',
        ],
      },
      {
        id: 'intent',
        label: '総合',
        question: '制作者はこの作品を通じて何を実現しようとしたと思う？',
        hints: [
          '全体を通じて伝わるメッセージは？',
          '制作者の価値観や思想が見えますか？',
          'この作品が成功しているとしたら、なぜですか？',
        ],
      },
    ],
  },

  self: {
    key: 'self',
    name: '自己照合',
    description: '作品と自分の共鳴を探る',
    steps: [
      {
        id: 'atmosphere',
        label: '空気感',
        question: 'どんな「空気感」や「世界観」に惹かれた？',
        hints: [
          'この作品の持つ雰囲気を言葉にすると？',
          '自分が好む世界観と重なりますか？',
          '惹かれる感情の根っこにあるものは何ですか？',
        ],
      },
      {
        id: 'origin',
        label: '原体験',
        question: '過去に似た感覚を覚えたものはある？',
        hints: [
          '子どもの頃に好きだったものと繋がりますか？',
          '似た感動を与えてくれた別の作品は？',
          'この感覚はいつ頃から自分にありますか？',
        ],
      },
      {
        id: 'standard',
        label: '価値基準',
        question: 'この作品が「良くない」と感じる人には何が欠けていると思う？',
        hints: [
          '自分が美しいと感じる条件は何ですか？',
          '好みが分かれる理由を想像すると？',
          '自分の価値基準を一言で表すと？',
        ],
      },
      {
        id: 'aspiration',
        label: '自己との関係',
        question: '「こうありたい」と思うものを体現していますか？',
        hints: [
          'この作品は自分の理想と重なりますか？',
          '自分が作るとしたら何を大切にしますか？',
          'この作品から自分への問いかけはありますか？',
        ],
      },
    ],
  },
}

export const FRAMEWORK_LIST = Object.values(FRAMEWORKS)

export function getFramework(key: FrameworkKey): Framework {
  return FRAMEWORKS[key]
}

export const CATEGORY_LABELS: Record<string, string> = {
  movie: '映像・映画',
  anime: 'アニメ',
  illustration: 'イラスト',
  photo: '写真',
  music: '音楽',
  design: 'デザイン',
  other: 'その他',
}
