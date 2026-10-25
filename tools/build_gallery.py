#!/usr/bin/env python3
"""Gera galeria.html com os 153 Folkmons para revisao dos sprites."""

import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "folkmons_data.js"
OUT = ROOT / "galeria.html"

ENTRY_RE = re.compile(
    r'\{ id: "([^"]+)", name: "([^"]+)", element: "([^"]+)", folklore: "([^"]+)"'
)


def stage_of(folkmom_id: str) -> str:
    if folkmom_id.startswith("START_"):
        return "inicial"
    if folkmom_id.endswith("B"):
        return "final"
    if folkmom_id.endswith("A"):
        return "middle"
    return "base"


def main() -> None:
    prompts = {}
    prompts_path = ROOT / "tools" / "prompts.json"
    if prompts_path.exists():
        for job in json.loads(prompts_path.read_text()):
            prompts[job["id"]] = job.get("prompt", "")

    found = {}
    for folkmom_id, name, element, folklore in ENTRY_RE.findall(DATA.read_text()):
        found[folkmom_id] = {
            "id": folkmom_id,
            "name": name,
            "element": element,
            "folklore": folklore,
            "stage": stage_of(folkmom_id),
            "prompt": prompts.get(folkmom_id, ""),
        }

    def sort_key(item):
        if item["id"].startswith("START_"):
            return (0, item["id"])
        return (1, item["id"])

    folkmons = sorted(found.values(), key=sort_key)
    payload = json.dumps(folkmons, ensure_ascii=False)
    total = len(folkmons)
    ready = sum(
        1
        for folkmom in folkmons
        if (ROOT / "assets" / "sprites" / f"{folkmom['id']}.png").exists()
    )

    page = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Galeria dos Folkmons</title>
<style>
  :root {{
    --bg: #0b1220;
    --panel: #16213a;
    --panel-2: #1e2d4d;
    --text: #e8eefc;
    --muted: #9fb0cf;
    --line: #2c3d61;
  }}
  * {{ box-sizing: border-box; }}
  body {{
    margin: 0;
    background: radial-gradient(circle at top, #16213a 0, var(--bg) 55%);
    color: var(--text);
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    min-height: 100vh;
  }}
  header {{
    padding: 28px 24px 18px;
    border-bottom: 1px solid var(--line);
    background: rgba(11, 18, 32, .85);
    backdrop-filter: blur(8px);
    position: sticky;
    top: 0;
    z-index: 10;
  }}
  h1 {{ margin: 0 0 6px; font-size: 24px; }}
  .sub {{ margin: 0 0 16px; color: var(--muted); font-size: 14px; }}
  .sub a {{ color: #7dd3fc; }}
  .controls {{ display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }}
  input[type="search"], select {{
    background: var(--panel);
    color: var(--text);
    border: 1px solid var(--line);
    border-radius: 9px;
    padding: 9px 11px;
    font-size: 14px;
    outline: none;
  }}
  input[type="search"] {{ min-width: 260px; flex: 1; max-width: 420px; }}
  input[type="search"]:focus, select:focus {{ border-color: #60a5fa; }}
  label.toggle {{ display: inline-flex; gap: 7px; align-items: center; color: var(--muted); font-size: 14px; }}
  main {{
    padding: 22px 24px 48px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 14px;
    max-width: 1500px;
    margin: 0 auto;
  }}
  .card {{
    background: linear-gradient(180deg, var(--panel-2), var(--panel));
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }}
  .sprite-wrap {{
    height: 150px;
    border-radius: 10px;
    display: grid;
    place-items: center;
    overflow: hidden;
    background-color: #0e1729;
    background-image:
      linear-gradient(45deg, #1a2740 25%, transparent 25%),
      linear-gradient(-45deg, #1a2740 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #1a2740 75%),
      linear-gradient(-45deg, transparent 75%, #1a2740 75%);
    background-size: 18px 18px;
    background-position: 0 0, 0 9px, 9px -9px, -9px 0;
  }}
  .sprite-wrap.chroma {{ background: #00ff00; }}
  .sprite-wrap.missing::after {{
    content: "aguardando...";
    color: #64748b;
    font-size: 12px;
    font-weight: 600;
  }}
  .sprite-wrap img {{
    width: 128px;
    height: 128px;
    object-fit: contain;
    image-rendering: pixelated;
  }}
  .card h3 {{ margin: 0; font-size: 15px; line-height: 1.25; }}
  .meta {{ display: flex; flex-wrap: wrap; gap: 5px; }}
  .badge {{
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .02em;
    padding: 3px 7px;
    border-radius: 999px;
    background: #26385c;
    color: #cbd5e1;
  }}
  .badge.Agua {{ background: #123b63; color: #93c5fd; }}
  .badge.Grama {{ background: #143d26; color: #86efac; }}
  .badge.Fogo {{ background: #4a1d1d; color: #fca5a5; }}
  .badge.Trevas {{ background: #2e1b4a; color: #c4b5fd; }}
  .badge.Vento {{ background: #0f3b40; color: #67e8f9; }}
  .badge.Terra {{ background: #3f2e14; color: #fcd34d; }}
  .badge.Eletrico {{ background: #43380d; color: #fde047; }}
  .badge.stage {{ background: #1f2f4d; color: #a8b8d8; }}
  .lore {{ margin: 0; color: var(--muted); font-size: 12px; line-height: 1.35; }}
  .id {{ margin: 0; color: #64748b; font-size: 11px; font-family: ui-monospace, monospace; }}
  .copy {{
    margin-top: auto;
    background: #223354;
    color: #cfe0ff;
    border: 1px solid #36507d;
    border-radius: 8px;
    padding: 6px 8px;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
  }}
  .copy:hover {{ background: #2c4270; }}
  .empty {{ grid-column: 1 / -1; text-align: center; color: var(--muted); padding: 60px 0; }}
  @media (max-width: 600px) {{
    header {{ padding: 18px 14px 14px; }}
    main {{ padding: 14px; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }}
    .sprite-wrap {{ height: 120px; }}
    .sprite-wrap img {{ width: 100px; height: 100px; }}
    input[type="search"] {{ min-width: 0; }}
  }}
</style>
</head>
<body>
<header>
  <h1>Galeria dos Folkmons</h1>
  <p class="sub">{total} formas · {ready} sprites prontos · <a href="index.html">abrir o jogo</a> · sprites em <code>assets/sprites/</code>, fundo verde em <code>assets/chroma/</code></p>
  <div class="controls">
    <input type="search" id="search" placeholder="Buscar por nome, ID ou folclore...">
    <select id="element">
      <option value="">Todos os elementos</option>
      <option value="Agua">Água</option>
      <option value="Grama">Grama</option>
      <option value="Fogo">Fogo</option>
      <option value="Trevas">Trevas</option>
      <option value="Vento">Vento</option>
      <option value="Terra">Terra</option>
      <option value="Eletrico">Elétrico</option>
    </select>
    <select id="stage">
      <option value="">Todas as formas</option>
      <option value="inicial">Iniciais</option>
      <option value="base">Formas base</option>
      <option value="middle">Evolução 1</option>
      <option value="final">Evolução final</option>
    </select>
    <label class="toggle"><input type="checkbox" id="chroma"> Mostrar fundo verde</label>
  </div>
</header>
<main id="grid"></main>
<script>
const FOLKMONS = {payload};
const LABEL = {{Agua:'Água', Grama:'Grama', Fogo:'Fogo', Trevas:'Trevas', Vento:'Vento', Terra:'Terra', Eletrico:'Elétrico'}};
const STAGE = {{inicial:'Inicial', base:'Forma base', middle:'Evolução 1', final:'Evolução final'}};
const grid = document.getElementById('grid');
const search = document.getElementById('search');
const element = document.getElementById('element');
const stage = document.getElementById('stage');
const chroma = document.getElementById('chroma');

function esc(value) {{
  return String(value).replace(/[&<>"']/g, c => ({{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}})[c]);
}}

function badges(f) {{
  return f.element.split('/').map(e => '<span class="badge ' + esc(e) + '">' + esc(LABEL[e] || e) + '</span>').join('') +
    '<span class="badge stage">' + esc(STAGE[f.stage] || f.stage) + '</span>';
}}

function render() {{
  const term = search.value.trim().toLowerCase();
  const el = element.value;
  const st = stage.value;
  const useChroma = chroma.checked;
  const list = FOLKMONS.filter(f => {{
    if (el && !f.element.split('/').includes(el)) return false;
    if (st && f.stage !== st) return false;
    if (term && !(f.name + ' ' + f.id + ' ' + f.folklore).toLowerCase().includes(term)) return false;
    return true;
  }});
  grid.innerHTML = list.length ? list.map(f => {{
    const src = useChroma ? 'assets/chroma/' + f.id + '.png' : 'assets/sprites/' + f.id + '.png';
    return '<article class="card">' +
      '<div class="sprite-wrap' + (useChroma ? ' chroma' : '') + '">' +
        '<img src="' + src + '" loading="lazy" alt="' + esc(f.name) + '" ' +
          `onerror="this.style.display='none';this.parentElement.classList.add('missing')">` +
      '</div>' +
      '<h3>' + esc(f.name) + '</h3>' +
      '<div class="meta">' + badges(f) + '</div>' +
      '<p class="lore">' + esc(f.folklore) + '</p>' +
      '<p class="id">' + esc(f.id) + '</p>' +
      '<button class="copy" data-prompt="' + esc(f.prompt) + '" onclick="copyPrompt(this)">copiar prompt</button>' +
    '</article>';
  }}).join('') : '<div class="empty">Nenhum Folkmom encontrado.</div>';
}}

function fallbackCopy(text, done) {{
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {{
    document.execCommand('copy');
    done();
  }} catch (e) {{
    alert('Nao foi possivel copiar. Prompt:\\n\\n' + text);
  }}
  ta.remove();
}}

function copyPrompt(btn) {{
  const text = btn.dataset.prompt || '';
  if (!text) {{ btn.textContent = 'sem prompt'; return; }}
  const done = () => {{
    btn.textContent = 'copiado!';
    setTimeout(() => {{ btn.textContent = 'copiar prompt'; }}, 1300);
  }};
  if (navigator.clipboard && navigator.clipboard.writeText) {{
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  }} else {{
    fallbackCopy(text, done);
  }}
}}

search.addEventListener('input', render);
element.addEventListener('change', render);
stage.addEventListener('change', render);
chroma.addEventListener('change', render);
render();
</script>
</body>
</html>
"""

    OUT.write_text(page)
    print(f"galeria gerada: {OUT} ({total} folkmons)")


if __name__ == "__main__":
    main()
