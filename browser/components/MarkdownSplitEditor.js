import React from 'react'
import CodeEditor from 'browser/components/CodeEditor'
import MarkdownPreview from 'browser/components/MarkdownPreview'
import { findStorage } from 'browser/lib/findStorage'
import _ from 'lodash'

import styles from './MarkdownSplitEditor.styl'
import CSSModules from 'browser/lib/CSSModules'

class MarkdownSplitEditor extends React.Component {
  constructor (props) {
    super(props)
    this.value = props.value
    this.focus = () => this.refs.code.focus()
    this.reload = () => this.refs.code.reload()
    this.userScroll = true
  }

  handleOnChange () {
    this.value = this.refs.code.value
    this.props.onChange()
  }

  handleScroll (e) {
    const previewDoc = _.get(this, 'refs.preview.refs.root.contentWindow.document')
    const codeDoc = _.get(this, 'refs.code.editor.doc')
    let srcTop, srcHeight, targetTop, targetHeight

    if (this.userScroll) {
      if (e.doc) {
        srcTop = _.get(e, 'doc.scrollTop')
        srcHeight = _.get(e, 'doc.height')
        targetTop = _.get(previewDoc, 'body.scrollTop')
        targetHeight = _.get(previewDoc, 'body.scrollHeight')
      } else {
        srcTop = _.get(previewDoc, 'body.scrollTop')
        srcHeight = _.get(previewDoc, 'body.scrollHeight')
        targetTop = _.get(codeDoc, 'scrollTop')
        targetHeight = _.get(codeDoc, 'height')
      }

      const distance = (targetHeight * srcTop / srcHeight) - targetTop
      const framerate = 1000 / 60
      const frames = 20
      const refractory = frames * framerate

      this.userScroll = false

      let frame = 0
      let scrollPos, time
      const timer = setInterval(() => {
        time = frame / frames
        scrollPos = time < 0.5
                  ? 2 * time * time // ease in
                  : -1 + (4 - 2 * time) * time // ease out
        if (e.doc) _.set(previewDoc, 'body.scrollTop', targetTop + scrollPos * distance)
        else _.get(this, 'refs.code.editor').scrollTo(0, targetTop + scrollPos * distance)
        if (frame >= frames) {
          clearInterval(timer)
          setTimeout(() => { this.userScroll = true }, refractory)
        }
        frame++
      }, framerate)
    }
  }

  handleCheckboxClick (e) {
    e.preventDefault()
    e.stopPropagation()
    const idMatch = /checkbox-([0-9]+)/
    const checkedMatch = /\[x\]/i
    const uncheckedMatch = /\[ \]/
    if (idMatch.test(e.target.getAttribute('id'))) {
      const lineIndex = parseInt(e.target.getAttribute('id').match(idMatch)[1], 10) - 1
      const lines = this.refs.code.value
        .split('\n')

      const targetLine = lines[lineIndex]

      if (targetLine.match(checkedMatch)) {
        lines[lineIndex] = targetLine.replace(checkedMatch, '[ ]')
      }
      if (targetLine.match(uncheckedMatch)) {
        lines[lineIndex] = targetLine.replace(uncheckedMatch, '[x]')
      }
      this.refs.code.setValue(lines.join('\n'))
    }
  }

  render () {
    const {config, value, storageKey, noteKey} = this.props
    const storage = findStorage(storageKey)
    let editorFontSize = parseInt(config.editor.fontSize, 10)
    if (!(editorFontSize > 0 && editorFontSize < 101)) editorFontSize = 14
    let editorIndentSize = parseInt(config.editor.indentSize, 10)
    if (!(editorFontSize > 0 && editorFontSize < 132)) editorIndentSize = 4
    const previewStyle = {}
    if (this.props.ignorePreviewPointerEvents) previewStyle.pointerEvents = 'none'
    return (
      <div styleName='root'>
        <CodeEditor
          styleName='codeEditor'
          ref='code'
          mode='GitHub Flavored Markdown'
          value={value}
          theme={config.editor.theme}
          keyMap={config.editor.keyMap}
          fontFamily={config.editor.fontFamily}
          fontSize={editorFontSize}
          displayLineNumbers={config.editor.displayLineNumbers}
          indentType={config.editor.indentType}
          indentSize={editorIndentSize}
          enableRulers={config.editor.enableRulers}
          rulers={config.editor.rulers}
          scrollPastEnd={config.editor.scrollPastEnd}
          fetchUrlTitle={config.editor.fetchUrlTitle}
          storageKey={storageKey}
          noteKey={noteKey}
          onChange={this.handleOnChange.bind(this)}
          onScroll={this.handleScroll.bind(this)}
       />
        <MarkdownPreview
          style={previewStyle}
          styleName='preview'
          theme={config.ui.theme}
          keyMap={config.editor.keyMap}
          fontSize={config.preview.fontSize}
          fontFamily={config.preview.fontFamily}
          codeBlockTheme={config.preview.codeBlockTheme}
          codeBlockFontFamily={config.editor.fontFamily}
          lineNumber={config.preview.lineNumber}
          scrollPastEnd={config.preview.scrollPastEnd}
          smartQuotes={config.preview.smartQuotes}
          sanitize={config.preview.sanitize}
          ref='preview'
          tabInde='0'
          value={value}
          onCheckboxClick={(e) => this.handleCheckboxClick(e)}
          onScroll={this.handleScroll.bind(this)}
          showCopyNotification={config.ui.showCopyNotification}
          storagePath={storage.path}
       />
      </div>
    )
  }
}

export default CSSModules(MarkdownSplitEditor, styles)
