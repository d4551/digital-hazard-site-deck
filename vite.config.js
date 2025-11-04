import { defineConfig } from 'vite'
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  plugins: [
    {
      name: 'copy-js-files',
      closeBundle() {
        // Copy js folder to dist
        const srcDir = 'js'
        const destDir = 'dist/js'
        
        try {
          mkdirSync(destDir, { recursive: true })
          
          const files = readdirSync(srcDir)
          files.forEach(file => {
            const srcPath = join(srcDir, file)
            const stat = statSync(srcPath)
            
            if (stat.isFile() && file.endsWith('.js')) {
              const destPath = join(destDir, file)
              copyFileSync(srcPath, destPath)
              console.log(`Copied: ${srcPath} -> ${destPath}`)
            }
          })
        } catch (error) {
          console.error('Error copying JS files:', error)
        }
        
        // Copy css folder to dist
        try {
          const cssSrcDir = 'css'
          const cssDestDir = 'dist/css'
          mkdirSync(cssDestDir, { recursive: true })
          
          const cssFiles = readdirSync(cssSrcDir)
          cssFiles.forEach(file => {
            const srcPath = join(cssSrcDir, file)
            const stat = statSync(srcPath)
            
            if (stat.isFile()) {
              const destPath = join(cssDestDir, file)
              copyFileSync(srcPath, destPath)
              console.log(`Copied: ${srcPath} -> ${destPath}`)
            }
          })
        } catch (error) {
          console.error('Error copying CSS files:', error)
        }
      }
    }
  ]
})
