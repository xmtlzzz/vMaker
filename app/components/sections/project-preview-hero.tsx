import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { languageIconConfig } from '~/components/language-badges'
import type { Locale } from '~/data/copy'
import type { GitHubOwner, Project } from '~/lib/github/projects'

type CodeToken = {
  text: string
  type:
    'plain' | 'keyword' | 'string' | 'comment' | 'fn' | 'tag' | 'attr' | 'type'
}

type SnippetDef = {
  filename: string
  lines: CodeToken[][]
  rawCode: string
}

function buildProjectSnippet(project: Project): SnippetDef {
  const name = project.name
  const desc = project.description || ''
  const lang = (project.primaryLanguage || '').toLowerCase()

  if (
    name === 'IPViewer' ||
    (lang === 'html' && name.toLowerCase().includes('ip'))
  ) {
    const raw = `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>IPViewer · IP Subnets & CIDR Calculator</title>
    <link rel="stylesheet" href="./style.css" />
  </head>
  <body>
    <!-- 纯前端单文件无依赖，支持 CIDR 子网划分与 IP 范围快速检索 -->
    <main class="ip-container">
      <input id="cidr-input" placeholder="输入 IP/掩码，例如 192.168.1.0/24" />
      <div id="subnet-matrix" class="subnet-grid"></div>
    </main>
    <script src="./app.js"></script>
  </body>
</html>`

    const lines: CodeToken[][] = [
      [{ text: '<!DOCTYPE html>', type: 'tag' }],
      [
        { text: '<', type: 'tag' },
        { text: 'html', type: 'tag' },
        { text: ' lang', type: 'attr' },
        { text: '=', type: 'plain' },
        { text: '"zh-CN"', type: 'string' },
        { text: '>', type: 'tag' },
      ],
      [{ text: '  <head>', type: 'tag' }],
      [
        { text: '    <meta ', type: 'tag' },
        { text: 'charset', type: 'attr' },
        { text: '="UTF-8" />', type: 'string' },
      ],
      [
        { text: '    <title>', type: 'tag' },
        { text: 'IPViewer · IP Subnets & CIDR Calculator', type: 'plain' },
        { text: '</title>', type: 'tag' },
      ],
      [
        { text: '    <link ', type: 'tag' },
        { text: 'rel', type: 'attr' },
        { text: '="stylesheet" ', type: 'string' },
        { text: 'href', type: 'attr' },
        { text: '="./style.css" />', type: 'string' },
      ],
      [{ text: '  </head>', type: 'tag' }],
      [{ text: '  <body>', type: 'tag' }],
      [
        {
          text: '    <!-- 纯前端单文件无依赖，支持 CIDR 子网划分与 IP 范围快速检索 -->',
          type: 'comment',
        },
      ],
      [
        { text: '    <main ', type: 'tag' },
        { text: 'class', type: 'attr' },
        { text: '="ip-container">', type: 'string' },
      ],
      [
        { text: '      <input ', type: 'tag' },
        { text: 'id', type: 'attr' },
        { text: '="cidr-input" ', type: 'string' },
        { text: 'placeholder', type: 'attr' },
        { text: '="输入 IP/掩码，例如 192.168.1.0/24" />', type: 'string' },
      ],
      [
        { text: '      <div ', type: 'tag' },
        { text: 'id', type: 'attr' },
        { text: '="subnet-matrix" ', type: 'string' },
        { text: 'class', type: 'attr' },
        { text: '="subnet-grid"></div>', type: 'string' },
      ],
      [{ text: '    </main>', type: 'tag' }],
      [
        { text: '    <script ', type: 'tag' },
        { text: 'src', type: 'attr' },
        { text: '="./app.js"></script>', type: 'string' },
      ],
      [{ text: '  </body>', type: 'tag' }],
      [{ text: '</html>', type: 'tag' }],
    ]

    return { filename: 'index.html', lines, rawCode: raw }
  }

  if (name === 'codeviewer' || lang === 'rust') {
    const raw = `// Powered By Rust Tauri · 现代化代码与包查看器
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, Result};

#[tauri::command]
fn inspect_source(file_path: &str) -> Result<String> {
    println!("[codeviewer] Loading source file: {file_path}");
    std::fs::read_to_string(file_path).map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![inspect_source])
        .run(tauri::generate_context!())
        .expect("error while running codeviewer application");
}`

    const lines: CodeToken[][] = [
      [
        {
          text: '// Powered By Rust Tauri · 现代化代码与包查看器',
          type: 'comment',
        },
      ],
      [
        {
          text: '#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]',
          type: 'comment',
        },
      ],
      [],
      [
        { text: 'use ', type: 'keyword' },
        { text: 'tauri::{Manager, Result};', type: 'type' },
      ],
      [],
      [{ text: '#[tauri::command]', type: 'attr' }],
      [
        { text: 'fn ', type: 'keyword' },
        { text: 'inspect_source', type: 'fn' },
        { text: '(file_path: &', type: 'plain' },
        { text: 'str', type: 'type' },
        { text: ') -> ', type: 'plain' },
        { text: 'Result', type: 'type' },
        { text: '<', type: 'plain' },
        { text: 'String', type: 'type' },
        { text: '> {', type: 'plain' },
      ],
      [
        { text: '    println!(', type: 'plain' },
        {
          text: '"[codeviewer] Loading source file: {file_path}"',
          type: 'string',
        },
        { text: ');', type: 'plain' },
      ],
      [
        { text: '    std::fs::', type: 'plain' },
        { text: 'read_to_string', type: 'fn' },
        { text: '(file_path).', type: 'plain' },
        { text: 'map_err', type: 'fn' },
        { text: '(|e| e.', type: 'plain' },
        { text: 'to_string', type: 'fn' },
        { text: '())', type: 'plain' },
      ],
      [{ text: '}', type: 'plain' }],
      [],
      [
        { text: 'fn ', type: 'keyword' },
        { text: 'main', type: 'fn' },
        { text: '() {', type: 'plain' },
      ],
      [
        { text: '    tauri::Builder::', type: 'plain' },
        { text: 'default', type: 'fn' },
        { text: '()', type: 'plain' },
      ],
      [
        { text: '        .', type: 'plain' },
        { text: 'invoke_handler', type: 'fn' },
        { text: '(tauri::generate_handler![inspect_source])', type: 'plain' },
      ],
      [
        { text: '        .', type: 'plain' },
        { text: 'run', type: 'fn' },
        { text: '(tauri::generate_context!())', type: 'plain' },
      ],
      [
        { text: '        .', type: 'plain' },
        { text: 'expect', type: 'fn' },
        {
          text: '("error while running codeviewer application");',
          type: 'string',
        },
      ],
      [{ text: '}', type: 'plain' }],
    ]

    return { filename: 'src-tauri/src/main.rs', lines, rawCode: raw }
  }

  if (
    name === 'pUI' ||
    (lang === 'typescript' && name.toLowerCase().includes('ui'))
  ) {
    const raw = `// for any wireshark export packages viewer ui
import { parsePcapPayload, renderHexStream } from './analyzer'

export interface PacketInspectorProps {
  streamId: string
  rawBytes: Uint8Array
}

export function inspectPacket({ streamId, rawBytes }: PacketInspectorProps) {
  const packet = parsePcapPayload(rawBytes)
  console.log(\`[pUI] Stream \${streamId}: \${packet.proto} (\${packet.len} bytes)\`)
  return renderHexStream(packet.payload)
}`

    const lines: CodeToken[][] = [
      [
        {
          text: '// for any wireshark export packages viewer ui',
          type: 'comment',
        },
      ],
      [
        { text: 'import ', type: 'keyword' },
        { text: '{ parsePcapPayload, renderHexStream }', type: 'plain' },
        { text: ' from ', type: 'keyword' },
        { text: "'./analyzer'", type: 'string' },
      ],
      [],
      [
        { text: 'export interface ', type: 'keyword' },
        { text: 'PacketInspectorProps ', type: 'type' },
        { text: '{', type: 'plain' },
      ],
      [
        { text: '  streamId: ', type: 'plain' },
        { text: 'string', type: 'type' },
      ],
      [
        { text: '  rawBytes: ', type: 'plain' },
        { text: 'Uint8Array', type: 'type' },
      ],
      [{ text: '}', type: 'plain' }],
      [],
      [
        { text: 'export function ', type: 'keyword' },
        { text: 'inspectPacket', type: 'fn' },
        { text: '({ streamId, rawBytes }: ', type: 'plain' },
        { text: 'PacketInspectorProps', type: 'type' },
        { text: ') {', type: 'plain' },
      ],
      [
        { text: '  const packet = ', type: 'plain' },
        { text: 'parsePcapPayload', type: 'fn' },
        { text: '(rawBytes)', type: 'plain' },
      ],
      [
        { text: '  console.', type: 'plain' },
        { text: 'log', type: 'fn' },
        {
          text: '(`[pUI] Stream ${streamId}: ${packet.proto} (${packet.len} bytes)`)',
          type: 'string',
        },
      ],
      [
        { text: '  return ', type: 'keyword' },
        { text: 'renderHexStream', type: 'fn' },
        { text: '(packet.payload)', type: 'plain' },
      ],
      [{ text: '}', type: 'plain' }],
    ]

    return { filename: 'src/viewer/inspector.ts', lines, rawCode: raw }
  }

  if (lang === 'go' || name === 'cloudPulse' || name === 'cmdb') {
    const raw = `package main

import (
	"context"
	"log"
	"net/http"
)

// ${desc || project.displayName}
func handleProbe(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(\`{"service":"${name}","status":"healthy"}\`))
}

func main() {
	http.HandleFunc("/healthz", handleProbe)
	log.Printf("[${name}] Service running on :8080")
	http.ListenAndServe(":8080", nil)
}`

    const lines: CodeToken[][] = [
      [
        { text: 'package ', type: 'keyword' },
        { text: 'main', type: 'plain' },
      ],
      [],
      [
        { text: 'import ', type: 'keyword' },
        { text: '(', type: 'plain' },
      ],
      [{ text: '	"context"', type: 'string' }],
      [{ text: '	"log"', type: 'string' }],
      [{ text: '	"net/http"', type: 'string' }],
      [{ text: ')', type: 'plain' }],
      [],
      [{ text: `// ${desc || project.displayName}`, type: 'comment' }],
      [
        { text: 'func ', type: 'keyword' },
        { text: 'handleProbe', type: 'fn' },
        { text: '(w http.ResponseWriter, r *http.Request) {', type: 'plain' },
      ],
      [
        { text: '	w.Header().', type: 'plain' },
        { text: 'Set', type: 'fn' },
        { text: '("Content-Type", "application/json")', type: 'string' },
      ],
      [
        { text: '	w.', type: 'plain' },
        { text: 'WriteHeader', type: 'fn' },
        { text: '(http.StatusOK)', type: 'plain' },
      ],
      [
        { text: '	w.', type: 'plain' },
        { text: 'Write', type: 'fn' },
        {
          text: '([]byte(`{"service":"' + name + '","status":"healthy"}`))',
          type: 'string',
        },
      ],
      [{ text: '}', type: 'plain' }],
      [],
      [
        { text: 'func ', type: 'keyword' },
        { text: 'main', type: 'fn' },
        { text: '() {', type: 'plain' },
      ],
      [
        { text: '	http.', type: 'plain' },
        { text: 'HandleFunc', type: 'fn' },
        { text: '("/healthz", handleProbe)', type: 'string' },
      ],
      [
        { text: '	log.', type: 'plain' },
        { text: 'Printf', type: 'fn' },
        { text: '("[' + name + '] Service running on :8080")', type: 'string' },
      ],
      [
        { text: '	http.', type: 'plain' },
        { text: 'ListenAndServe', type: 'fn' },
        { text: '(":8080", nil)', type: 'string' },
      ],
      [{ text: '}', type: 'plain' }],
    ]

    return { filename: 'main.go', lines, rawCode: raw }
  }

  if (
    lang === 'python' ||
    name.includes('script') ||
    name.includes('exporter')
  ) {
    const raw = `#!/usr/bin/env python3
"""${desc || project.displayName}"""
import argparse
import sys

def main():
    parser = argparse.ArgumentParser(description="${name}")
    parser.add_argument("--verbose", action="store_true", help="启用详细日志")
    args = parser.parse_args()

    print(f"[*] 初始化 {name} 模块运行环境...")

if __name__ == "__main__":
    main()`

    const lines: CodeToken[][] = [
      [{ text: '#!/usr/bin/env python3', type: 'comment' }],
      [{ text: `"""${desc || project.displayName}"""`, type: 'comment' }],
      [
        { text: 'import ', type: 'keyword' },
        { text: 'argparse', type: 'plain' },
      ],
      [
        { text: 'import ', type: 'keyword' },
        { text: 'sys', type: 'plain' },
      ],
      [],
      [
        { text: 'def ', type: 'keyword' },
        { text: 'main', type: 'fn' },
        { text: '():', type: 'plain' },
      ],
      [
        { text: '    parser = argparse.', type: 'plain' },
        { text: 'ArgumentParser', type: 'fn' },
        { text: `(description="${name}")`, type: 'string' },
      ],
      [
        { text: '    parser.', type: 'plain' },
        { text: 'add_argument', type: 'fn' },
        {
          text: '("--verbose", action="store_true", help="启用详细日志")',
          type: 'string',
        },
      ],
      [
        { text: '    args = parser.', type: 'plain' },
        { text: 'parse_args', type: 'fn' },
        { text: '()', type: 'plain' },
      ],
      [],
      [
        { text: '    print(', type: 'plain' },
        { text: 'f"[*] 初始化 ' + name + ' 模块运行环境..."', type: 'string' },
        { text: ')', type: 'plain' },
      ],
      [],
      [
        { text: 'if ', type: 'keyword' },
        { text: '__name__ == ', type: 'plain' },
        { text: '"__main__"', type: 'string' },
        { text: ':', type: 'plain' },
      ],
      [{ text: '    main()', type: 'plain' }],
    ]

    return { filename: 'main.py', lines, rawCode: raw }
  }

  if (lang === 'shell' || lang === 'bash' || name === 'HotStart') {
    const raw = `#!/usr/bin/env bash
# ${desc || project.displayName}
set -euo pipefail

echo "[*] ${name}: 正在加载启动配置..."

start_service() {
    echo "[!] 启动运行环境并监听文件变更..."
    exec ./run.sh "$@"
}

start_service "$@"`

    const lines: CodeToken[][] = [
      [{ text: '#!/usr/bin/env bash', type: 'comment' }],
      [{ text: `# ${desc || project.displayName}`, type: 'comment' }],
      [{ text: 'set -euo pipefail', type: 'plain' }],
      [],
      [
        { text: 'echo ', type: 'fn' },
        { text: `"[!] ${name}: 正在加载启动配置..."`, type: 'string' },
      ],
      [],
      [
        { text: 'start_service', type: 'fn' },
        { text: '() {', type: 'plain' },
      ],
      [
        { text: '    echo ', type: 'fn' },
        { text: '"[*] 启动运行环境并监听文件变更..."', type: 'string' },
      ],
      [
        { text: '    exec ', type: 'keyword' },
        { text: './run.sh "$@"', type: 'plain' },
      ],
      [{ text: '}', type: 'plain' }],
      [],
      [{ text: 'start_service "$@"', type: 'plain' }],
    ]

    return { filename: 'start.sh', lines, rawCode: raw }
  }

  if (name === 'vMusic') {
    const raw = `// 轻量级现代在线音乐播放器与音频流媒体应用
export class AudioPlayer {
  private ctx: AudioContext = new AudioContext()
  private audioNode: HTMLAudioElement = new Audio()

  async playTrack(url: string, title: string) {
    console.log(\`[vMusic] Playing \${title}: \${url}\`)
    this.audioNode.src = url
    await this.audioNode.play()
  }
}`

    const lines: CodeToken[][] = [
      [
        {
          text: '// 轻量级现代在线音乐播放器与音频流媒体应用',
          type: 'comment',
        },
      ],
      [
        { text: 'export class ', type: 'keyword' },
        { text: 'AudioPlayer ', type: 'type' },
        { text: '{', type: 'plain' },
      ],
      [
        { text: '  private ctx: ', type: 'plain' },
        { text: 'AudioContext', type: 'type' },
        { text: ' = new ', type: 'plain' },
        { text: 'AudioContext', type: 'type' },
        { text: '()', type: 'plain' },
      ],
      [
        { text: '  private audioNode: ', type: 'plain' },
        { text: 'HTMLAudioElement', type: 'type' },
        { text: ' = new ', type: 'plain' },
        { text: 'Audio', type: 'type' },
        { text: '()', type: 'plain' },
      ],
      [],
      [
        { text: '  async ', type: 'keyword' },
        { text: 'playTrack', type: 'fn' },
        { text: '(url: ', type: 'plain' },
        { text: 'string', type: 'type' },
        { text: ', title: ', type: 'plain' },
        { text: 'string', type: 'type' },
        { text: ') {', type: 'plain' },
      ],
      [
        { text: '    console.', type: 'plain' },
        { text: 'log', type: 'fn' },
        { text: '(`[vMusic] Playing ${title}: ${url}`)', type: 'string' },
      ],
      [{ text: '    this.audioNode.src = url', type: 'plain' }],
      [
        { text: '    await ', type: 'keyword' },
        { text: 'this.audioNode.', type: 'plain' },
        { text: 'play', type: 'fn' },
        { text: '()', type: 'plain' },
      ],
      [{ text: '  }', type: 'plain' }],
      [{ text: '}', type: 'plain' }],
    ]

    return { filename: 'src/player/audioEngine.ts', lines, rawCode: raw }
  }

  if (name.includes('astro')) {
    const raw = `---
// 基于 Astro 的现代化博客起步模板与静态站点脚手架
import BaseLayout from '../layouts/BaseLayout.astro'
import PostCard from '../components/PostCard.astro'
const posts = await Astro.glob('../posts/*.md')
---
<BaseLayout title="My Astro Blog">
  <main class="post-feed">
    {posts.map((post) => <PostCard post={post} />)}
  </main>
</BaseLayout>`

    const lines: CodeToken[][] = [
      [{ text: '---', type: 'comment' }],
      [
        {
          text: '// 基于 Astro 的现代化博客起步模板与静态站点脚手架',
          type: 'comment',
        },
      ],
      [
        { text: 'import ', type: 'keyword' },
        { text: 'BaseLayout', type: 'type' },
        { text: ' from ', type: 'keyword' },
        { text: "'../layouts/BaseLayout.astro'", type: 'string' },
      ],
      [
        { text: 'import ', type: 'keyword' },
        { text: 'PostCard', type: 'type' },
        { text: ' from ', type: 'keyword' },
        { text: "'../components/PostCard.astro'", type: 'string' },
      ],
      [
        { text: 'const posts = await ', type: 'plain' },
        { text: 'Astro.glob', type: 'fn' },
        { text: "('../posts/*.md')", type: 'string' },
      ],
      [{ text: '---', type: 'comment' }],
      [
        { text: '<', type: 'tag' },
        { text: 'BaseLayout', type: 'type' },
        { text: ' title', type: 'attr' },
        { text: '="My Astro Blog">', type: 'string' },
      ],
      [
        { text: '  <main ', type: 'tag' },
        { text: 'class', type: 'attr' },
        { text: '="post-feed">', type: 'string' },
      ],
      [
        { text: '    {posts.', type: 'plain' },
        { text: 'map', type: 'fn' },
        { text: '((post) => <', type: 'plain' },
        { text: 'PostCard', type: 'type' },
        { text: ' post={post} />)}', type: 'plain' },
      ],
      [{ text: '  </main>', type: 'tag' }],
      [
        { text: '</', type: 'tag' },
        { text: 'BaseLayout', type: 'type' },
        { text: '>', type: 'tag' },
      ],
    ]

    return { filename: 'src/pages/index.astro', lines, rawCode: raw }
  }

  if (name.includes('Invoice') || lang === 'vue') {
    const raw = `<template>
  <div class="invoice-container">
    <header class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-bold">发票开具与财务流转管理</h2>
      <el-button type="primary">新建发票</el-button>
    </header>
    <el-table :data="invoices" stripe class="w-full" />
  </div>
</template>`

    const lines: CodeToken[][] = [
      [{ text: '<template>', type: 'tag' }],
      [
        { text: '  <div ', type: 'tag' },
        { text: 'class', type: 'attr' },
        { text: '="invoice-container">', type: 'string' },
      ],
      [
        { text: '    <header ', type: 'tag' },
        { text: 'class', type: 'attr' },
        { text: '="flex justify-between items-center mb-6">', type: 'string' },
      ],
      [
        { text: '      <h2 ', type: 'tag' },
        { text: 'class', type: 'attr' },
        { text: '="text-xl font-bold">', type: 'string' },
        { text: '发票开具与财务流转管理', type: 'plain' },
        { text: '</h2>', type: 'tag' },
      ],
      [
        { text: '      <', type: 'tag' },
        { text: 'el-button', type: 'type' },
        { text: ' type', type: 'attr' },
        { text: '="primary">', type: 'string' },
        { text: '新建发票', type: 'plain' },
        { text: '</', type: 'tag' },
        { text: 'el-button', type: 'type' },
        { text: '>', type: 'tag' },
      ],
      [{ text: '    </header>', type: 'tag' }],
      [
        { text: '    <', type: 'tag' },
        { text: 'el-table', type: 'type' },
        { text: ' :data', type: 'attr' },
        { text: '="invoices" ', type: 'string' },
        { text: 'stripe ', type: 'attr' },
        { text: 'class', type: 'attr' },
        { text: '="w-full" />', type: 'string' },
      ],
      [{ text: '  </div>', type: 'tag' }],
      [{ text: '</template>', type: 'tag' }],
    ]

    return { filename: 'src/views/InvoiceList.vue', lines, rawCode: raw }
  }

  if (name.includes('rust')) {
    const raw = `//! Rust 现代化工程脚手架与最佳实践起步模板

pub fn initialize_service() -> Result<(), Box<dyn std::error::Error>> {
    println!("[rust-template] Service initialized successfully.");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_init() {
        assert!(initialize_service().is_ok());
    }
}`

    const lines: CodeToken[][] = [
      [
        {
          text: '//! Rust 现代化工程脚手架与最佳实践起步模板',
          type: 'comment',
        },
      ],
      [],
      [
        { text: 'pub fn ', type: 'keyword' },
        { text: 'initialize_service', type: 'fn' },
        { text: '() -> ', type: 'plain' },
        { text: 'Result', type: 'type' },
        { text: '<(), ', type: 'plain' },
        { text: 'Box', type: 'type' },
        { text: '<dyn std::error::Error>> {', type: 'plain' },
      ],
      [
        { text: '    println!(', type: 'plain' },
        {
          text: '"[rust-template] Service initialized successfully."',
          type: 'string',
        },
        { text: ');', type: 'plain' },
      ],
      [
        { text: '    ', type: 'plain' },
        { text: 'Ok', type: 'fn' },
        { text: '(())', type: 'plain' },
      ],
      [{ text: '}', type: 'plain' }],
      [],
      [{ text: '#[cfg(test)]', type: 'attr' }],
      [
        { text: 'mod ', type: 'keyword' },
        { text: 'tests', type: 'type' },
        { text: ' {', type: 'plain' },
      ],
      [
        { text: '    use ', type: 'keyword' },
        { text: 'super::*;', type: 'plain' },
      ],
      [],
      [{ text: '    #[test]', type: 'attr' }],
      [
        { text: '    fn ', type: 'keyword' },
        { text: 'test_init', type: 'fn' },
        { text: '() {', type: 'plain' },
      ],
      [
        { text: '        assert!(', type: 'plain' },
        { text: 'initialize_service', type: 'fn' },
        { text: '().', type: 'plain' },
        { text: 'is_ok', type: 'fn' },
        { text: '());', type: 'plain' },
      ],
      [{ text: '    }', type: 'plain' }],
      [{ text: '}', type: 'plain' }],
    ]

    return { filename: 'src/lib.rs', lines, rawCode: raw }
  }

  // Generic TypeScript / JavaScript fallback
  const raw = `// ${desc || project.displayName}
import { defineConfig } from 'vite'

export default defineConfig({
  root: './src',
  build: {
    target: 'esnext',
    outDir: '../dist',
  },
})`

  const lines: CodeToken[][] = [
    [{ text: `// ${desc || project.displayName}`, type: 'comment' }],
    [
      { text: 'import ', type: 'keyword' },
      { text: '{ defineConfig }', type: 'plain' },
      { text: ' from ', type: 'keyword' },
      { text: "'vite'", type: 'string' },
    ],
    [],
    [
      { text: 'export default ', type: 'keyword' },
      { text: 'defineConfig', type: 'fn' },
      { text: '({', type: 'plain' },
    ],
    [
      { text: '  root: ', type: 'plain' },
      { text: "'./src',", type: 'string' },
    ],
    [{ text: '  build: {', type: 'plain' }],
    [
      { text: '    target: ', type: 'plain' },
      { text: "'esnext',", type: 'string' },
    ],
    [
      { text: '    outDir: ', type: 'plain' },
      { text: "'../dist',", type: 'string' },
    ],
    [{ text: '  },', type: 'plain' }],
    [{ text: '})', type: 'plain' }],
  ]

  return { filename: 'vite.config.ts', lines, rawCode: raw }
}

export function ProjectPreviewHero({
  isDark,
  locale,
  owner: _owner,
  project,
  showcase,
  t: _t,
}: {
  isDark: boolean
  locale: Locale
  owner?: GitHubOwner
  project: Project
  showcase?: { previewCaption?: string }
  t?: Record<string, string>
}) {
  const [copied, setCopied] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Has a dedicated product screenshot (e.g. /previews/vmaker.jpg)
  const hasRealCover = Boolean(project.cover)

  const snippet = buildProjectSnippet(project)
  const langBadge = languageIconConfig(project.primaryLanguage || 'code')
  const LangIcon = langBadge.icon

  const handleCopyCode = (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      navigator.clipboard.writeText(snippet.rawCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  // If a real screenshot exists and hasn't errored out, render the screenshot
  if (hasRealCover && !imageError) {
    return (
      <figure className="detail-preview-figure mt-6">
        <div className="relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-black/20">
          {!imageLoaded && (
            <div className="flex h-64 w-full animate-pulse items-center justify-center bg-white/5">
              <span className="font-mono text-xs opacity-50">
                Loading preview...
              </span>
            </div>
          )}
          <img
            alt={showcase?.previewCaption || `${project.displayName} preview`}
            className={`detail-preview w-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            decoding="async"
            loading="lazy"
            onError={() => setImageError(true)}
            onLoad={() => setImageLoaded(true)}
            src={project.cover}
          />
        </div>
        {showcase?.previewCaption && (
          <figcaption className="detail-preview-caption mt-3 text-xs opacity-60">
            {showcase.previewCaption}
          </figcaption>
        )}
      </figure>
    )
  }

  // Otherwise, render the streamlined macOS Code Editor Preview Window
  // (Zero metric duplication: no stars, no forks, no size, no clone, no duplicate language bar!)
  return (
    <figure className="detail-preview-figure mt-6">
      <div
        className={`detail-code-window relative overflow-hidden rounded-[1.25rem] border transition-all duration-200 ${
          isDark
            ? 'border-white/10 bg-[#0d1117] text-zinc-100 shadow-xl shadow-black/30'
            : 'border-zinc-200/90 bg-[#f8fafc] text-zinc-800 shadow-lg shadow-zinc-200/60'
        }`}
      >
        {/* macOS Titlebar & Active Tab */}
        <div
          className={`flex items-center justify-between border-b px-4 py-2.5 sm:px-5 ${
            isDark
              ? 'border-white/10 bg-white/[0.03]'
              : 'border-zinc-200 bg-zinc-100/70'
          }`}
        >
          {/* Traffic light dots & Active File Tab */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="size-3 rounded-full bg-[#ff5f56]" />
              <span className="size-3 rounded-full bg-[#ffbd2e]" />
              <span className="size-3 rounded-full bg-[#27c93f]" />
            </div>

            <div
              className={`flex items-center gap-2 rounded-md px-2.5 py-1 font-mono text-xs font-medium transition-colors ${
                isDark
                  ? 'bg-white/10 text-zinc-200'
                  : 'border border-zinc-200/60 bg-white text-zinc-700 shadow-xs'
              }`}
            >
              <LangIcon className="size-3.5 shrink-0" />
              <span>{snippet.filename}</span>
            </div>
          </div>

          {/* Right Action: Copy Code Button */}
          <button
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
              isDark
                ? 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white'
                : 'bg-zinc-200/70 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900'
            }`}
            onClick={handleCopyCode}
            type="button"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-emerald-500" />
                <span className="font-mono text-[11px] text-emerald-500">
                  {locale === 'zh' ? '已复制' : 'Copied!'}
                </span>
              </>
            ) : (
              <>
                <Copy className="size-3.5 opacity-70" />
                <span className="font-mono text-[11px]">
                  {locale === 'zh' ? '复制代码' : 'Copy'}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Code Editor Body */}
        <div className="touch-pan-x [scrollbar-width:thin] overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed sm:p-5">
          <table className="w-full min-w-full border-collapse">
            <tbody>
              {snippet.lines.map((line, lineIdx) => (
                <tr key={lineIdx} className="hover:bg-zinc-500/5">
                  {/* Line Number */}
                  <td
                    aria-hidden="true"
                    className="w-7 pr-4 text-right align-top text-[11px] opacity-30 select-none"
                  >
                    {lineIdx + 1}
                  </td>
                  {/* Line Code */}
                  <td className="align-top whitespace-pre">
                    {line.length === 0 ? (
                      <span>&nbsp;</span>
                    ) : (
                      line.map((token, tokIdx) => {
                        let colorClass = ''
                        if (token.type === 'keyword') {
                          colorClass = isDark
                            ? 'text-purple-400 font-semibold'
                            : 'text-purple-600 font-semibold'
                        } else if (token.type === 'string') {
                          colorClass = isDark
                            ? 'text-emerald-400'
                            : 'text-emerald-600'
                        } else if (token.type === 'comment') {
                          colorClass = isDark
                            ? 'text-zinc-500 italic'
                            : 'text-slate-400 italic'
                        } else if (token.type === 'fn') {
                          colorClass = isDark ? 'text-sky-400' : 'text-sky-600'
                        } else if (token.type === 'tag') {
                          colorClass = isDark
                            ? 'text-rose-400'
                            : 'text-rose-600'
                        } else if (token.type === 'attr') {
                          colorClass = isDark
                            ? 'text-amber-300'
                            : 'text-amber-600'
                        } else if (token.type === 'type') {
                          colorClass = isDark
                            ? 'text-teal-300'
                            : 'text-teal-600'
                        }

                        return (
                          <span key={tokIdx} className={colorClass}>
                            {token.text}
                          </span>
                        )
                      })
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showcase?.previewCaption ? (
        <figcaption className="detail-preview-caption mt-2.5 text-xs opacity-60">
          {showcase.previewCaption}
        </figcaption>
      ) : (
        <figcaption className="detail-preview-caption mt-2.5 text-xs opacity-60">
          {project.displayName} ·{' '}
          {locale === 'zh' ? '核心代码实现预览' : 'Source code preview'}
        </figcaption>
      )}
    </figure>
  )
}
