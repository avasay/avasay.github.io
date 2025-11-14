# Create a a custom code block extension for Tiptap that uses Prism.js.

## Application involved:
- Directory: GitHubBlogSpaCMS
- Project Name: GitHubBlogSpaCMS

## Objective
This is a request to add a custom button inside the TipTap editor - a second code block button called "Prism Code Block" that adds code syntax highlighting to source code.

## Implementation Example
This is the response I got from Claude.ai about how to add a code syntax highlighting for TipTap. 

We want to keep the current "Code Block" button in the toolbar. We only need to add a second code block button called "Prism Code Block". I also asked that we prevent any conflict with the use of '<pre>' and '<code>' tags because "Code Block" might already be using them, and Calude AI suggested to make them distinct by using a diffenret name (different node type) 'codeBlockPrism', and adding a distinguishing class <code> dom.classList.add('prism-code-block') </code>.

Note: You don't have to follow or use the source codes suggested by Claude AI. This is a response from an AI chat that has not seen my local CMS project, but I think this is close to how it is supposed to be implemented Add the Prism Code Block and implement it as you see fit. 

**HTML for your toolbar:**

```html
<div id="toolbar">
  <!-- Your existing buttons -->
  <button id="btn-code-block" class="toolbar-btn">
    Code Block
  </button>
  
  <!-- New Prism Code Block button -->
  <button id="btn-prism-code-block" class="toolbar-btn">
    Prism Code Block
  </button>
  
  <!-- Optional: Language selector for Prism -->
  <select id="prism-language-select" class="toolbar-select">
    <option value="">Select Language...</option>
    <option value="csharp">C#</option>
    <option value="javascript">JavaScript</option>
    <option value="html">HTML</option>
    <option value="css">CSS</option>
    <option value="razor">Razor</option>
    <option value="sql">SQL</option>
  </select>
</div>

<div id="editor"></div>
```

**JavaScript to wire up the buttons:**

```javascript
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { CodeBlock } from '@tiptap/extension-code-block'
import Prism from 'prismjs'
import 'prismjs/themes/prism.css'
import 'prismjs/components/prism-csharp'
import 'prismjs/components/prism-javascript'
// ... import other languages

// Create Prism extension
const CodeBlockPrism = CodeBlock.extend({
  name: 'codeBlockPrism',
  
  addAttributes() {
    return {
      language: {
        default: 'csharp',
        parseHTML: element => {
          const code = element.querySelector('code')
          return code?.className.replace('language-', '') || 'csharp'
        }
      }
    }
  },
  
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('pre')
      dom.classList.add('prism-code-block')
      const code = document.createElement('code')
      
      code.className = `language-${node.attrs.language || 'csharp'}`
      code.textContent = node.textContent
      
      Prism.highlightElement(code)
      
      dom.appendChild(code)
      
      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type !== node.type) return false
          code.className = `language-${updatedNode.attrs.language || 'csharp'}`
          code.textContent = updatedNode.textContent
          Prism.highlightElement(code)
          return true
        }
      }
    }
  }
})

// Initialize editor
const editor = new Editor({
  element: document.querySelector('#editor'),
  extensions: [
    StarterKit, // Includes default CodeBlock
    CodeBlockPrism, // Your Prism version
  ],
  content: '<p>Start typing...</p>',
})

// Wire up the regular code block button
document.getElementById('btn-code-block').addEventListener('click', () => {
  editor.chain().focus().toggleCodeBlock().run()
})

// Wire up the Prism code block button
document.getElementById('btn-prism-code-block').addEventListener('click', () => {
  const language = document.getElementById('prism-language-select').value || 'csharp'
  editor.chain().focus().setNode('codeBlockPrism', { language }).run()
})

// Optional: Update button active states
editor.on('selectionUpdate', () => {
  const codeBlockBtn = document.getElementById('btn-code-block')
  const prismCodeBlockBtn = document.getElementById('btn-prism-code-block')
  
  if (editor.isActive('codeBlock')) {
    codeBlockBtn.classList.add('is-active')
  } else {
    codeBlockBtn.classList.remove('is-active')
  }
  
  if (editor.isActive('codeBlockPrism')) {
    prismCodeBlockBtn.classList.add('is-active')
  } else {
    prismCodeBlockBtn.classList.remove('is-active')
  }
})
```

**CSS for styling:**

```css
.toolbar-btn {
  padding: 8px 12px;
  margin: 4px;
  border: 1px solid #ccc;
  background: white;
  cursor: pointer;
}

.toolbar-btn:hover {
  background: #f0f0f0;
}

.toolbar-btn.is-active {
  background: #e0e0e0;
  border-color: #999;
  font-weight: bold;
}

.toolbar-select {
  padding: 8px;
  margin: 4px;
}

.prism-code-block {
  border-left: 4px solid #5c6ac4;
  background: #f5f5f5;
}
```

Are you using a module bundler like Webpack or Vite for your Express.js app, or are you loading scripts directly in the browser?