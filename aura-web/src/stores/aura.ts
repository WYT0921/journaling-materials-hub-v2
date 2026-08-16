import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { loadCatalog } from '../repositories/catalogRepository'
import { ProjectRepository } from '../repositories/projectRepository'
import { migrateProject, newProject, templatePresentation, type AuraCatalog, type AuraProject, type AuraTemplate } from '../types/aura'

const repository = new ProjectRepository()

export const useAuraStore = defineStore('aura', () => {
  const catalog = ref<AuraCatalog | null>(null)
  const projects = ref<AuraProject[]>([])
  const active = ref<AuraProject | null>(null)
  const activePhotoUrl = ref<string>()
  const activeAudioUrl = ref<string>()
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
    clearAudioUrl()
    active.value = newProject(templateKey)
    await save()
  }

  async function open(project: AuraProject) {
    clearPhotoUrl()
    clearAudioUrl()
    active.value = migrateProject(JSON.parse(JSON.stringify(project)))
    const photo = await repository.getPhoto(project.photoKey)
    activePhotoUrl.value = photo ? URL.createObjectURL(photo) : undefined
    const audio = await repository.getAudio(project.audioKey)
    activeAudioUrl.value = audio ? URL.createObjectURL(audio) : undefined
  }

  async function openById(id: string) {
    await initialize()
    const project = projects.value.find(item => item.id === id) || await repository.find(id)
    if (!project) return false
    await open(project)
    return true
  }

  function applyTemplate(key: string) {
    if (!active.value) return
    const presentation = templatePresentation[key] || templatePresentation['fresh-rounded']
    active.value.templateKey = key
    active.value.adjustments.playerStyle = presentation.playerStyle
    active.value.adjustments.notePath = presentation.notePath
  }

  async function setMedia(file: File, palette: string[]) {
    if (!active.value) return
    const key = await repository.putPhoto(active.value.id, file)
    clearPhotoUrl()
    activePhotoUrl.value = URL.createObjectURL(file)
    active.value.photoKey = key
    active.value.mediaType = file.type.startsWith('video/') ? 'video' : 'image'
    active.value.palette = palette
    touch()
    await save()
  }

  async function setAudio(file: File) {
    if (!active.value) return
    const key = await repository.putAudio(active.value.id, file)
    clearAudioUrl()
    activeAudioUrl.value = URL.createObjectURL(file)
    active.value.audioKey = key
    active.value.audioName = file.name
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

  function clearAudioUrl() {
    if (activeAudioUrl.value) URL.revokeObjectURL(activeAudioUrl.value)
    activeAudioUrl.value = undefined
  }

  return { catalog, projects, active, activePhotoUrl, activeAudioUrl, activeTemplate, ready, initialize, create, open, openById, applyTemplate, setMedia, setAudio, save, remove }
})
