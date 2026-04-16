<template>
  <v-dialog v-model="isShown" hide-overlay transition="dialog-bottom-transition" width="600" scrollable>
    <v-card class="flex flex-col overflow-auto">
      <v-toolbar color="primary" dark flat>
        <v-toolbar-title class="d-flex align-center">
          <v-icon class="mr-2">forum</v-icon>
          Brasilcraft
        </v-toolbar-title>
        <v-spacer />
        <v-btn icon @click="hide">
          <v-icon>close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-card-text class="pa-4">
        <v-card outlined class="mb-4">
          <v-card-text>
            <div class="text-h6 mb-2">Site oficial</div>
            <div class="text-body-2 text--secondary mb-4">Noticias e informacoes do launcher e da comunidade.</div>
            <v-btn color="primary" href="https://www.brasilcraft.net" target="browser">Abrir site</v-btn>
          </v-card-text>
        </v-card>

        <v-card outlined>
          <v-card-text>
            <div class="text-h6 mb-2">Discord Brasilcraft</div>
            <div class="text-body-2 text--secondary mb-4">Entre para suporte, avisos e novidades do servidor.</div>
            <v-btn color="amber darken-3" dark href="https://discord.com/invite/pzzfBB5f4H" target="browser">Entrar no Discord</v-btn>
          </v-card-text>
        </v-card>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { useDialog } from '../composables/dialog'

const { hide, isShown } = useDialog('feedback')

watch(isShown, (v) => {
  if (v) {
    windowController.focus()
  }
})
</script>
