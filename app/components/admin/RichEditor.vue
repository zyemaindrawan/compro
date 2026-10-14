<script setup lang="ts">
import type { DropdownMenuItem, EditorToolbarItem } from '@nuxt/ui'
import type { Editor } from '@tiptap/vue-3'
import type { EditorView } from '@tiptap/pm/view'
import { TableKit } from '@tiptap/extension-table'
import { Youtube } from '@tiptap/extension-youtube'
import type { MediaAsset } from '#shared/types/models'

const json = defineModel<Record<string, unknown>>('json', { required: true })
const html = defineModel<string>('html', { required: true })

const notify = useNotify()
const { uploadMany } = useMediaUpload()

const editorRef = useTemplateRef<{ editor?: Editor }>('editorRef')
const editorInstance = computed((): Editor | undefined => editorRef.value?.editor)
const pickerOpen = ref(false)
const uploading = ref(0)
const linkUrl = ref('')
const videoUrl = ref('')

const extensions = [
  TableKit.configure({ table: { resizable: false } }),
  Youtube.configure({ nocookie: true, modestBranding: true, width: 640, height: 360 }),
]

const starterKit = {
  heading: { levels: [2, 3, 4] as (2 | 3 | 4)[] },
  link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
}

function insertMedia(editor: Editor, media: MediaAsset) {
  editor.chain().focus().setImage({
    src: media.url,
    alt: media.alt,
    width: media.width ?? undefined,
    height: media.height ?? undefined,
  }).run()
}

function insertSelected(media: MediaAsset) {
  if (editorInstance.value) insertMedia(editorInstance.value, media)
}

async function insertFiles(files: File[]) {
  const editor = editorInstance.value
  const images = files.filter(file => file.type.startsWith('image/'))
  if (!editor || !images.length) return false

  uploading.value += images.length
  const uploaded = await uploadMany(images)
  uploading.value -= images.length
  uploaded.forEach(media => insertMedia(editor, media))
  if (uploaded.length) notify.success(uploaded.length === 1 ? 'Image added' : `${uploaded.length} images added`)
  return true
}

function filesFrom(list: FileList | null | undefined) {
  return list ? Array.from(list) : []
}

const editorProps = {
  handlePaste: (_view: EditorView, event: ClipboardEvent) => {
    const files = filesFrom(event.clipboardData?.files)
    if (!files.some(file => file.type.startsWith('image/'))) return false
    insertFiles(files)
    return true
  },
  handleDrop: (_view: EditorView, event: DragEvent) => {
    const files = filesFrom(event.dataTransfer?.files)
    if (!files.some(file => file.type.startsWith('image/'))) return false
    event.preventDefault()
    insertFiles(files)
    return true
  },
}

function onUpdate(value: unknown) {
  json.value = (value ?? {}) as Record<string, unknown>
  html.value = editorInstance.value?.getHTML() ?? ''
}

function applyLink() {
  const editor = editorInstance.value
  if (!editor) return
  const href = linkUrl.value.trim()
  if (!href) {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  const normalized = /^(https?:|mailto:|tel:|\/)/i.test(href) ? href : `https://${href}`
  editor.chain().focus().extendMarkRange('link').setLink({ href: normalized }).run()
}

function openLink() {
  linkUrl.value = editorInstance.value?.getAttributes('link').href ?? ''
}

function insertVideo() {
  const editor = editorInstance.value
  if (!editor) return
  const src = videoUrl.value.trim()
  if (!src) return
  const ok = editor.chain().focus().setYoutubeVideo({ src }).run()
  if (!ok) notify.error(null, 'That does not look like a YouTube link')
  videoUrl.value = ''
}

function tableItems(editor: Editor): DropdownMenuItem[][] {
  const inTable = editor.isActive('table')
  return [
    [{ label: 'Insert table', icon: 'i-lucide-table', onSelect: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() }],
    [
      { label: 'Add row below', icon: 'i-lucide-between-horizontal-end', disabled: !inTable, onSelect: () => editor.chain().focus().addRowAfter().run() },
      { label: 'Add column right', icon: 'i-lucide-between-vertical-end', disabled: !inTable, onSelect: () => editor.chain().focus().addColumnAfter().run() },
      { label: 'Delete row', icon: 'i-lucide-rows-2', disabled: !inTable, onSelect: () => editor.chain().focus().deleteRow().run() },
      { label: 'Delete column', icon: 'i-lucide-columns-2', disabled: !inTable, onSelect: () => editor.chain().focus().deleteColumn().run() },
    ],
    [{ label: 'Delete table', icon: 'i-lucide-trash-2', color: 'error', disabled: !inTable, onSelect: () => editor.chain().focus().deleteTable().run() }],
  ]
}

function toolbar(editor: Editor): EditorToolbarItem[][] {
  return [
    [
      { kind: 'undo', icon: 'i-lucide-undo-2', tooltip: { text: 'Undo' } },
      { kind: 'redo', icon: 'i-lucide-redo-2', tooltip: { text: 'Redo' } },
    ],
    [
      {
        icon: 'i-lucide-heading',
        tooltip: { text: 'Text style' },
        content: { align: 'start' },
        items: [
          { kind: 'paragraph', label: 'Paragraph', icon: 'i-lucide-pilcrow' },
          { kind: 'heading', level: 2, label: 'Heading 2', icon: 'i-lucide-heading-2' },
          { kind: 'heading', level: 3, label: 'Heading 3', icon: 'i-lucide-heading-3' },
          { kind: 'heading', level: 4, label: 'Heading 4', icon: 'i-lucide-heading-4' },
        ],
      },
    ],
    [
      { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', tooltip: { text: 'Bold' } },
      { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', tooltip: { text: 'Italic' } },
      { kind: 'mark', mark: 'underline', icon: 'i-lucide-underline', tooltip: { text: 'Underline' } },
      { kind: 'mark', mark: 'strike', icon: 'i-lucide-strikethrough', tooltip: { text: 'Strikethrough' } },
      { kind: 'mark', mark: 'code', icon: 'i-lucide-code', tooltip: { text: 'Inline code' } },
    ],
    [
      { kind: 'bulletList', icon: 'i-lucide-list', tooltip: { text: 'Bullet list' } },
      { kind: 'orderedList', icon: 'i-lucide-list-ordered', tooltip: { text: 'Numbered list' } },
      { kind: 'blockquote', icon: 'i-lucide-text-quote', tooltip: { text: 'Quote' } },
      { kind: 'codeBlock', icon: 'i-lucide-square-code', tooltip: { text: 'Code block' } },
      { kind: 'horizontalRule', icon: 'i-lucide-separator-horizontal', tooltip: { text: 'Divider' } },
    ],
    [
      { slot: 'link', icon: 'i-lucide-link' },
      { icon: 'i-lucide-image', tooltip: { text: 'Insert image' }, onClick: () => { pickerOpen.value = true } },
      { slot: 'video', icon: 'i-lucide-youtube' },
      { icon: 'i-lucide-table', tooltip: { text: 'Table' }, content: { align: 'start' }, items: tableItems(editor) },
    ],
  ]
}
</script>

<template>
  <div class="overflow-hidden rounded-lg border border-default focus-within:border-primary">
    <UEditor
      ref="editorRef"
      v-slot="{ editor }"
      :model-value="json"
      content-type="json"
      :starter-kit="starterKit"
      :extensions="extensions"
      :editor-props="editorProps"
      placeholder="Write the article. Paste or drop images to upload them."
      :ui="{ base: 'min-h-96 px-4 py-6 sm:px-8' }"
      @update:model-value="onUpdate"
    >
      <UEditorToolbar
        :editor="editor"
        :items="toolbar(editor)"
        class="sticky top-0 z-10 overflow-x-auto border-b border-default bg-default px-2 py-1.5"
      >
        <template #link>
          <UPopover
            :content="{ align: 'start' }"
            @update:open="(open: boolean) => open && openLink()"
          >
            <UTooltip text="Link">
              <UButton
                icon="i-lucide-link"
                color="neutral"
                variant="ghost"
                size="sm"
                :active="editorInstance?.isActive('link')"
                active-variant="soft"
                aria-label="Link"
              />
            </UTooltip>
            <template #content>
              <form
                class="flex items-center gap-2 p-2"
                @submit.prevent="applyLink"
              >
                <UInput
                  v-model="linkUrl"
                  placeholder="https://example.com or /contact"
                  size="sm"
                  class="w-64"
                  autofocus
                />
                <UButton
                  type="submit"
                  label="Apply"
                  size="sm"
                />
              </form>
            </template>
          </UPopover>
        </template>
        <template #video>
          <UPopover :content="{ align: 'start' }">
            <UTooltip text="YouTube video">
              <UButton
                icon="i-lucide-youtube"
                color="neutral"
                variant="ghost"
                size="sm"
                aria-label="YouTube video"
              />
            </UTooltip>
            <template #content>
              <form
                class="flex items-center gap-2 p-2"
                @submit.prevent="insertVideo"
              >
                <UInput
                  v-model="videoUrl"
                  placeholder="https://www.youtube.com/watch?v=…"
                  size="sm"
                  class="w-64"
                  autofocus
                />
                <UButton
                  type="submit"
                  label="Embed"
                  size="sm"
                />
              </form>
            </template>
          </UPopover>
        </template>
      </UEditorToolbar>

      <MediaPickerModal
        v-model:open="pickerOpen"
        title="Insert image"
        @select="insertSelected"
      />
    </UEditor>

    <div
      v-if="uploading"
      class="flex items-center gap-2 border-t border-default px-4 py-2 text-sm text-muted"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="size-4 animate-spin"
      />
      Uploading {{ uploading }} {{ uploading === 1 ? 'image' : 'images' }}…
    </div>
  </div>
</template>
