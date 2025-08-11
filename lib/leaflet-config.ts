// lib/leaflet-config.ts

// Função para limpar completamente um container do mapa
export const cleanupMapContainer = (container: HTMLElement) => {
  if (!container) return

  try {
    // Remove todas as instâncias do Leaflet do container
    const leafletElements = container.querySelectorAll('[class*="leaflet"]')
    leafletElements.forEach(el => {
      try {
        if (el instanceof HTMLElement) {
          // Remove todos os event listeners
          const clone = el.cloneNode(true)
          if (el.parentNode) {
            el.parentNode.replaceChild(clone, el)
          }
        }
      } catch (error) {
        console.log("Erro ao remover elemento Leaflet:", error)
      }
    })

    // Limpa completamente o conteúdo
    container.innerHTML = ''
    
    // Remove todas as classes que contenham 'leaflet'
    const classes = Array.from(container.classList)
    classes.forEach(cls => {
      if (cls.includes('leaflet')) {
        container.classList.remove(cls)
      }
    })
    
    // Remove todos os atributos relacionados ao Leaflet
    const attributes = Array.from(container.attributes)
    attributes.forEach(attr => {
      if (attr.name.includes('leaflet') || 
          attr.name.startsWith('data-leaflet') || 
          attr.name.startsWith('aria-') ||
          attr.name.startsWith('style')) {
        container.removeAttribute(attr.name)
      }
    })

    // Força a remoção de qualquer CSS inline que possa ter sido adicionado
    container.removeAttribute('style')
    
    // Remove qualquer elemento filho que possa ter sido criado dinamicamente
    while (container.firstChild) {
      container.removeChild(container.firstChild)
    }
  } catch (error) {
    console.error("Erro durante limpeza do container:", error)
    // Em caso de erro, força a limpeza completa
    container.innerHTML = ''
  }
}