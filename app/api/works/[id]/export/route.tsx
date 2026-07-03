import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { buildMarkdown, formatDateForFilename, sanitizeFilename } from '@/lib/export'
import { WorkPdfDocument } from '@/lib/pdf-document'

const SUPPORTED_FORMATS = ['md', 'pdf'] as const
type ExportFormat = (typeof SUPPORTED_FORMATS)[number]

function isExportFormat(value: string | null): value is ExportFormat {
  return value !== null && (SUPPORTED_FORMATS as readonly string[]).includes(value)
}

// GET /api/works/[id]/export?format=md|pdf
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const format = req.nextUrl.searchParams.get('format')

  if (!isExportFormat(format)) {
    return NextResponse.json(
      { error: 'format は md または pdf を指定してください' },
      { status: 400 }
    )
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: work, error } = await supabase
    .from('works')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !work) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const filenameBase = `${formatDateForFilename(work.created_at)}_${sanitizeFilename(work.title)}`

  if (format === 'md') {
    const markdown = buildMarkdown(work)

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filenameBase}.md"`,
      },
    })
  }

  const pdfBuffer = await renderToBuffer(<WorkPdfDocument work={work} />)

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filenameBase}.pdf"`,
    },
  })
}
