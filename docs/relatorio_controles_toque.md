# Relatório — Controles de toque

**Data:** 25/10/2026  
**Versão:** v0.4  
**Commit publicado:** `a558dcc`  
**Jogo:** https://kuradame13.github.io/folkmons/

## Resumo

O **direcional analógico** e os **botões de ação das mensagens** foram inseridos e publicados.

| Item | Situação | Evidência |
|---|---|---|
| Direcional analógico | **Inserido** | `#touchControls`, `#moveStick`, `#stickKnob` |
| Arrastar para andar | **Inserido** | Pointer Events + vetor `touchVector` |
| Velocidade analógica | **Inserido** | Distância do centro define a intensidade |
| Detecção automática no Android | **Inserida** | `maxTouchPoints` + `pointer: coarse` |
| Ativar/desativar manualmente | **Inserido** | Menu do Jogo → Interface → Direcional de toque |
| Botão **Continuar** nas mensagens | **Inserido** | `#toastNext` |
| Botão **Cancelar** nas mensagens | **Inserido** | `#toastCancel` |
| Toque na mensagem para avançar | **Inserido** | Clique no corpo do toast |
| Fila de mensagens | **Inserida** | `toastQueue` / `advanceToast()` |
| Cancelar limpa a fila | **Inserido** | `cancelToast()` |
| Mensagem legível fora da escala do jogo | **Inserido** | `.toast` com `position: fixed` |
| Ajuda e README atualizados | **Inserido** | Tópico “Android, direcional e mensagens” |

## O que ainda não existe

Não foram adicionados **botões de ação físicos no mapa** no estilo A/B (por exemplo, “Atacar” ou “Interagir” flutuando no lado direito). Nesta rodada, os botões de ação são os das mensagens:

- **Continuar** — avança para a próxima mensagem da fila.
- **Cancelar** — fecha a mensagem atual e limpa a fila.

O botão **Scan** e os oito menus do HUD continuam funcionando normalmente, mas permanecem dentro da área escalada do jogo.

## Como testar no Android

1. Abra o jogo em modo paisagem.
2. Entre na conta e escolha o inicial.
3. O direcional deve aparecer à esquerda; arraste o dedo para andar.
4. Se não aparecer, abra **Menu do Jogo → Interface → Direcional de toque**.
5. Salve o jogo ou colete um item para gerar uma mensagem.
6. Toque na mensagem ou em **Continuar**; use **Cancelar** para fechar e limpar a fila.

## Validação técnica

- `test_logic.js`: **passou**
- `test_cloud.js`: **passou**
- `test_hud.js`: **passou**, incluindo testes do direcional e da fila de mensagens
- HTML publicado contém `#touchControls`, `#toastNext` e `#toastCancel`
- JavaScript publicado contém `applyTouchControls`, `advanceToast` e `cancelToast`
- GitHub Pages respondeu **HTTP 200** com o commit `a558dcc`

> Observação: a conferência foi feita por inspeção do DOM, testes automatizados e verificação do código publicado. O navegador de captura de tela deste ambiente não abriu nesta rodada.
