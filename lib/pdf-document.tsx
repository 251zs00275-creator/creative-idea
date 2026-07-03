import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import { Work } from '@/types'
import { CATEGORY_LABELS, getFramework } from '@/lib/frameworks'
import { formatDateForDisplay, getWorksheetEntries } from '@/lib/export'

// 日本語表示のためフォントを登録（Noto Sans JP / Google Fonts CDN）
let fontsRegistered = false

function registerFonts() {
  if (fontsRegistered) return

  Font.register({
    family: 'Noto Sans JP',
    fonts: [
      {
        src: 'https://fonts.gstatic.com/s/notosansjp/v56/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEj75s.ttf',
        fontWeight: 'normal',
      },
      {
        src: 'https://fonts.gstatic.com/s/notosansjp/v56/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFPYk75s.ttf',
        fontWeight: 'bold',
      },
    ],
  })

  fontsRegistered = true
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Noto Sans JP',
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 48,
    color: '#1a1a1a',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  metaLabel: {
    fontSize: 9,
    color: '#666666',
    width: 80,
  },
  metaValue: {
    fontSize: 9,
    color: '#333333',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#dddddd',
    paddingBottom: 4,
  },
  memoBox: {
    fontSize: 10,
    lineHeight: 1.6,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 4,
  },
  worksheetItem: {
    marginBottom: 12,
  },
  worksheetLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  worksheetQuestion: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 4,
  },
  worksheetAnswer: {
    fontSize: 10,
    lineHeight: 1.6,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    fontSize: 8,
    color: '#999999',
    textAlign: 'center',
  },
})

export function WorkPdfDocument({ work }: { work: Work }) {
  registerFonts()

  const categoryLabel = CATEGORY_LABELS[work.category] ?? work.category
  const framework = work.framework ? getFramework(work.framework) : null
  const worksheetEntries = getWorksheetEntries(work)

  return (
    <Document title={work.title}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{work.title}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>カテゴリ</Text>
          <Text style={styles.metaValue}>{categoryLabel}</Text>
        </View>
        {work.url && (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>URL</Text>
            <Text style={styles.metaValue}>{work.url}</Text>
          </View>
        )}
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>記録日</Text>
          <Text style={styles.metaValue}>{formatDateForDisplay(work.created_at)}</Text>
        </View>
        {framework && (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>フレームワーク</Text>
            <Text style={styles.metaValue}>
              {framework.name}（{framework.description}）
            </Text>
          </View>
        )}

        {work.memo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>最初の一言</Text>
            <Text style={styles.memoBox}>{work.memo}</Text>
          </View>
        )}

        {worksheetEntries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>言語化メモ</Text>
            {worksheetEntries.map((entry) => (
              <View key={entry.label} style={styles.worksheetItem}>
                <Text style={styles.worksheetLabel}>{entry.label}</Text>
                <Text style={styles.worksheetQuestion}>Q. {entry.question}</Text>
                <Text style={styles.worksheetAnswer}>{entry.answer}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.footer}>Created with Creative Sense Archive</Text>
      </Page>
    </Document>
  )
}
