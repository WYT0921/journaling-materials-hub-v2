export const favoriteRecordsToMaterials = records => (records || [])
  .filter(record => record?.material?.materialType === 'single')
  .map(record => ({
    ...record.material,
    id: record.material.id || record.materialId,
    favoriteId: record.id
  }))
