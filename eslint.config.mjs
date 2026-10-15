import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    ignores: ['shared/types/database.ts', 'supabase/**'],
  },
  {
    files: ['app/pages/article/**/*.vue', 'app/components/blocks/BlockRichText.vue'],
    rules: {
      'vue/no-v-html': 'off',
    },
  },
)
