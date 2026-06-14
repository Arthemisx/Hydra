import React, { Component } from 'react'
import { Platform } from 'react-native'

export default class VLibras extends Component<{ forceOnload?: boolean }> {
  widgetSrc: string
  scriptSrc: string
  script: any

  constructor(props: any) {
    super(props)
    // URLs do VLibras
    this.widgetSrc = 'https://vlibras.gov.br/app'
    this.scriptSrc = 'https://vlibras.gov.br/app/vlibras-plugin.js'
  }

  // Carrega o script
  init() {
    this.script = document.createElement('script')
    this.script.src = this.scriptSrc
    this.script.async = true

    this.script.onload = () => {
      // Inicialização do widget
      // @ts-ignore
      new window.VLibras.Widget(this.widgetSrc)

      if (this.props.forceOnload) {
        // @ts-ignore
        window.onload()
      }
    }

    document.head.appendChild(this.script)
  }

  
  componentDidMount() {
  if (Platform.OS === 'web') {
    setTimeout(() => {
      this.init()
    }, 500)
  }
}

  componentWillUnmount() {
    if (this.script && document.head.contains(this.script)) {
      document.head.removeChild(this.script)
    }
  }

  render() {
  if (Platform.OS !== 'web') return null

  const divProps = {
    vw: "true",
    className: "enabled",
    style: {
      position: 'fixed' as const,
      bottom: 0,
      right: 0,
      zIndex: 2147483647,
      pointerEvents: 'all' as const,
      visibility: 'visible' as const,
      opacity: 1,
    }
  }
  const btnProps = {
  'vw-access-button': "true",
  className: "active",
}
  const wrapperProps = { 'vw-plugin-wrapper': "true" }

  return React.createElement(
    'div', divProps,
    React.createElement('div', btnProps),
    React.createElement('div', wrapperProps,
      React.createElement('div', { className: 'vw-plugin-top-wrapper' })
    )
  )
    }
}