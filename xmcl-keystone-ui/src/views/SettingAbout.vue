<template>
  <section class="about">
    <SettingCard>
      <div class="about-shell">
        <div class="about-header">
          <v-img :src="logo" alt="Brasilcraft Logo" max-width="72" class="about-logo" />
          <div>
            <a class="text-h5 about-title" href="https://www.brasilcraft.net" target="_blank">Brasilcraft-Laucher</a>
            <div class="text-body-2 text--secondary mt-2">
              Launcher oficial da comunidade Brasilcraft, customizado para acesso rapido ao nosso servidor.
            </div>
          </div>
          <v-spacer />
          <div class="about-license">
            <v-icon color="primary">verified</v-icon>
            <div class="text-caption">{{ t('setting.aboutLicense') }}</div>
          </div>
        </div>

        <v-textarea filled readonly class="px-4 mt-4" :value="debugInfo" />

        <div class="about-links">
          <v-card outlined class="about-link-card">
            <v-card-text>
              <div class="text-h6 mb-2">Site oficial</div>
              <div class="text-body-2 text--secondary mb-4">Noticias, informacoes e acesso rapido ao ecossistema Brasilcraft.</div>
              <v-btn color="primary" href="https://www.brasilcraft.net" target="browser">Abrir site</v-btn>
            </v-card-text>
          </v-card>

          <v-card outlined class="about-link-card">
            <v-card-text>
              <div class="text-h6 mb-2">Discord</div>
              <div class="text-body-2 text--secondary mb-4">Canal principal para suporte, avisos e comunidade.</div>
              <v-btn color="amber darken-3" dark href="https://discord.com/invite/pzzfBB5f4H" target="browser">Entrar no Discord</v-btn>
            </v-card-text>
          </v-card>
        </div>
      </div>
    </SettingCard>
  </section>
</template>

<script lang="ts" setup>
import logo from '@/assets/logobrasilcraft.webp'
import SettingCard from '@/components/SettingCard.vue'
import { kEnvironment } from '@/composables/environment'
import { kFlights } from '@/composables/flights'
import { injection } from '@/util/inject'

const env = injection(kEnvironment)
const flights = injection(kFlights)

const debugInfo = computed(() => JSON.stringify({ ...env.value, flights }, null, 2))
const { t } = useI18n()
</script>

<style scoped>
.about-shell {
  padding: 1rem;
}

.about-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.about-logo {
  border-radius: 0.75rem;
}

.about-title {
  color: #fff4bf;
  text-decoration: none;
}

.about-license {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.about-links {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  padding: 0 1rem 1rem;
}

.about-link-card {
  background: rgba(255, 255, 255, 0.03);
}
</style>
