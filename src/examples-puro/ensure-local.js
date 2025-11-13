import $ from '../jquery.reactive.es6.js'

export function initEnsureLocal() {
  const $ls1 = $('#local-state-1')
  const $ls2 = $('#local-state-2')

  if ($ls1.length) {
    $ls1.ensureState({ count: 0, name: '' })
    
    $('#ls1-count').reactive('count').text()
    $('#ls1-name').reactive('name')
    .map(name => name.toUpperCase())
    .text()
    $('#ls1-input-name').reactive('name').val()
    
    $('#ls1-inc').on('click', (e) => { e.preventDefault(); $ls1.state('count', c => (c || 0) + 1) })
    $('#ls1-dec').on('click', (e) => { e.preventDefault(); $ls1.state('count', c => (c || 0) - 1) })
    $('#ls1-reset').on('click', (e) => { e.preventDefault(); $ls1.state({ count: 0, name: '' }) })
  }

  if ($ls2.length) {
    $ls2.ensureState({ count: 100, label: '' }, { debug: false })
    $('#ls2-count').reactive('count').text()
    $('#ls2-label').reactive('label').text()
    $('#ls2-input-label').reactive('label').val()
    $('#ls2-inc').on('click', (e) => { e.preventDefault(); $ls2.state('count', c => (c || 0) + 10) })
    $('#ls2-dec').on('click', (e) => { e.preventDefault(); $ls2.state('count', c => (c || 0) - 10) })
    $('#ls2-reset').on('click', (e) => { e.preventDefault(); $ls2.state({ count: 100, label: '' }) })
  }
}