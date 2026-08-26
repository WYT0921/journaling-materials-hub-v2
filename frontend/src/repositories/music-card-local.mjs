const INDEX_FILE = 'projects.json'
const ROOT_FOLDER = 'music-card'
const PROJECT_SCHEMA_VERSION = 2
const PLAYER_ID_MIGRATIONS = { minimal: 'capsule', vintage: 'console', 'korean-pink': 'bubble', glass: 'waveform' }

const runtimeOrThrow = runtime => {
  const target = runtime || (typeof wx !== 'undefined' ? wx : undefined)
  if (!target?.env?.USER_DATA_PATH || !target.getFileSystemManager) throw new Error('当前环境不支持小程序本地文件系统')
  return target
}

const fsCall = (fs, method, options) => new Promise((resolve, reject) => {
  fs[method]({ ...options, success: resolve, fail: reject })
})

export const safeProjectId = value => {
  const id = String(value || '').trim()
  if (!/^[a-zA-Z0-9_-]{8,80}$/.test(id)) throw new Error('无效的本地项目编号')
  return id
}

export const mediaExtension = (path, type) => {
  const match = String(path || '').match(/\.([a-zA-Z0-9]{2,5})(?:\?.*)?$/)
  if (match) return `.${match[1].toLowerCase()}`
  return type === 'video' ? '.mp4' : '.jpg'
}

export const normalizeMusicCardProject = input => {
  const now = new Date().toISOString()
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    id: safeProjectId(input?.id),
    title: String(input?.title || input?.songInfo?.songName || '未命名音乐卡片'),
    canvasSize: input?.canvasSize || '3:4',
    media: input?.media ? {
      type: input.media.type === 'video' ? 'video' : 'image',
      localPath: String(input.media.localPath || ''),
      posterPath: input.media.posterPath ? String(input.media.posterPath) : undefined,
      width: Number(input.media.width) || 0,
      height: Number(input.media.height) || 0,
      duration: Number(input.media.duration) || 0,
      size: Number(input.media.size) || 0
    } : undefined,
    palette: Array.isArray(input?.palette) ? input.palette : [],
    songInfo: { songName: '', artist: '', album: '', lyrics: '', date: '', currentTime: '0:00', totalTime: '3:30', ...(input?.songInfo || {}) },
    backgroundStyle: { type: 'gradient', ...(input?.backgroundStyle || {}) },
    appearance: {
      photoSplit: .5, playerScale: 1, lyricsVisible: true, lyricsStyle: 'minimal-serif',
      lyricsFontSize: 1, lyricsOpacity: .72, decorationMotion: 'fall', decorationDistribution: 'trail',
      ...(input?.appearance || {})
    },
    playerTemplateId: PLAYER_ID_MIGRATIONS[input?.playerTemplateId] || input?.playerTemplateId || 'capsule',
    layers: Array.isArray(input?.layers) ? input.layers.map(layer => layer?.type === 'player' ? { ...layer, templateId: PLAYER_ID_MIGRATIONS[layer.templateId] || layer.templateId || 'capsule' } : layer) : [],
    decorations: Array.isArray(input?.decorations) ? input.decorations : [],
    createdAt: input?.createdAt || now,
    updatedAt: input?.updatedAt || now,
    needsMediaRepair: Boolean(input?.needsMediaRepair)
  }
}

export class MusicCardLocalRepository {
  constructor(runtime) {
    this.runtime = runtimeOrThrow(runtime)
    this.fs = this.runtime.getFileSystemManager()
    this.root = `${this.runtime.env.USER_DATA_PATH}/${ROOT_FOLDER}`
    this.indexPath = `${this.root}/${INDEX_FILE}`
  }

  projectDir(projectId) {
    return `${this.root}/${safeProjectId(projectId)}`
  }

  async ensureRoot() {
    await fsCall(this.fs, 'mkdir', { dirPath: this.root, recursive: true }).catch(error => {
      if (!String(error?.errMsg || error).includes('exist')) throw error
    })
  }

  async readIndex() {
    await this.ensureRoot()
    let result
    try {
      result = await fsCall(this.fs, 'readFile', { filePath: this.indexPath, encoding: 'utf8' })
    } catch (error) {
      const message = String(error?.errMsg || error)
      if (message.includes('no such file') || message.includes('not found')) return []
      throw error
    }
    try {
      const rows = JSON.parse(String(result.data || '[]'))
      return Array.isArray(rows) ? rows.map(normalizeMusicCardProject) : []
    } catch { throw new Error('本地音乐卡片索引已损坏') }
  }

  async writeIndex(projects) {
    await this.ensureRoot()
    await fsCall(this.fs, 'writeFile', { filePath: this.indexPath, data: JSON.stringify(projects), encoding: 'utf8' })
  }

  async listProjects() {
    const rows = await this.readIndex()
    return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  async getProject(projectId) {
    const id = safeProjectId(projectId)
    return (await this.readIndex()).find(project => project.id === id)
  }

  async saveProject(project) {
    const normalized = normalizeMusicCardProject({ ...project, updatedAt: new Date().toISOString() })
    const rows = await this.readIndex()
    const index = rows.findIndex(item => item.id === normalized.id)
    if (index >= 0) rows.splice(index, 1, normalized); else rows.push(normalized)
    await this.writeIndex(rows)
    return normalized
  }

  async importMedia(tempFilePath, type, projectId, metadata = {}) {
    if (!['image', 'video'].includes(type)) throw new Error('仅支持本地图片或视频')
    const dir = this.projectDir(projectId)
    await fsCall(this.fs, 'mkdir', { dirPath: dir, recursive: true }).catch(error => {
      if (!String(error?.errMsg || error).includes('exist')) throw error
    })
    const destination = `${dir}/source${mediaExtension(tempFilePath, type)}`
    await fsCall(this.fs, 'copyFile', { srcPath: tempFilePath, destPath: destination })
    return { type, localPath: destination, posterPath: type === 'image' ? destination : undefined, ...metadata }
  }

  async savePoster(tempFilePath, projectId) {
    const destination = `${this.projectDir(projectId)}/poster${mediaExtension(tempFilePath, 'image')}`
    await fsCall(this.fs, 'copyFile', { srcPath: tempFilePath, destPath: destination })
    return destination
  }

  async pathExists(path) {
    if (!path) return false
    try { await fsCall(this.fs, 'access', { path }); return true } catch { return false }
  }

  async repairProject(project) {
    const normalized = normalizeMusicCardProject(project)
    normalized.needsMediaRepair = Boolean(normalized.media?.localPath) && !(await this.pathExists(normalized.media.localPath))
    return normalized
  }

  async deleteProject(projectId) {
    const id = safeProjectId(projectId)
    const dir = this.projectDir(id)
    if (!dir.startsWith(`${this.root}/`)) throw new Error('拒绝删除非音乐卡片目录')
    await fsCall(this.fs, 'rmdir', { dirPath: dir, recursive: true }).catch(error => {
      const message = String(error?.errMsg || error)
      if (!message.includes('no such file') && !message.includes('not found')) throw error
    })
    await this.writeIndex((await this.readIndex()).filter(project => project.id !== id))
  }

  async inspectStorage() {
    const projects = await this.listProjects()
    return {
      projectCount: projects.length,
      declaredMediaBytes: projects.reduce((sum, project) => sum + (project.media?.size || 0), 0),
      repairCount: (await Promise.all(projects.map(project => this.repairProject(project)))).filter(project => project.needsMediaRepair).length
    }
  }
}

export const createMusicCardLocalRepository = runtime => new MusicCardLocalRepository(runtime)
