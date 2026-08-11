import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { loadCatalog } from '../repositories/catalogRepository'
import { ProjectRepository } from '../repositories/projectRepository'
import { newProject, type AuraCatalog, type AuraProject, type AuraTemplate } from '../types/aura'

const repository = new ProjectRepository()

export const useAuraStore = defineStore('aura', () => {
  const catalog = ref<AuraCatalog | null>(null)
  const projects = ref<AuraProject[]>([])
  const active = ref<AuraProject | null>(null)
  const activePhotoUrl = ref<string>()
  const ready = ref(false)
  const activeTemplate = computed<AuraTemplate | undefined>(() => catalog.value?.templates.find(item => item.key === active.value?.templateKey) || catalog.value?.templates[0])

  async function initialize() {
    if (ready.value) return
    ;[catalog.value, projects.value] = await Promise.all([loadCatalog(), repository.list()])
    ready.value = true
    navigator.storage?.persist?.().catch(() => false)
  }

  async function create(templateKey = 'fresh-rounded') {
    clearPhotoUrl()
    active.value = newProject(templateKey)
    await save()
  }

  async function open(project: AuraProject) {
    clearPhotoUrl()
    active.value = structuredClone(project)
    const photo = await repository.getPhoto(project.photoKey)
    activePhotoUrl.value = photo ? URL.createObjectURL(photo) : undefined
  }

  async function setPhoto(file: File, palette: string[]) {
    if (!active.value) return
    const key = await repository.putPhoto(active.value.id, file)
    clearPhotoUrl()
    activePhotoUrl.value = URL.createObjectURL(file)
    active.value.photoKey = key
    active.value.palette = palette
    touch()
    await save()
  }

  async function save() {
    if (!active.value) return
    const snapshot = JSON.parse(JSON.stringify(active.value)) as AuraProject
    snapshot.updatedAt = new Date().toISOString()
    snapshot.title = snapshot.music.songName.trim() || '未命名音乐卡片'
    await repository.save(snapshot)
    projects.value = await repository.list()
  }

  async function remove(project: AuraProject) {
    await repository.delete(project)
    projects.value = await repository.list()
  }

  function touch() {
    if (!active.value) return
    active.value.updatedAt = new Date().toISOString()
    active.value.title = active.value.music.songName.trim() || '未命名音乐卡片'
  }

  function clearPhotoUrl() {
    if (activePhotoUrl.value) URL.revokeObjectURL(activePhotoUrl.value)
    activePhotoUrl.value = undefined
  }

  return { catalog, projects, active, activePhotoUrl, activeTemplate, ready, initialize, create, open, setPhoto, save, remove }
})
