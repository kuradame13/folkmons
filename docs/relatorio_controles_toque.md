# Relatório — Botões direcionais e controles de toque

**Data:** 25/10/2026<br>
**Versão:** v0.5.1<br>
**Jogo:** https://kuradame13.github.io/folkmons/

## Resumo

O antigo direcional analógico foi substituído por **quatro botões direcionais
(▲ ◀ ▶ ▼) desenhados sobre a tela do jogo**. Os botões ficam dentro do cliente,
à esquerda, e não dependem mais de um elemento fixo fora da área escalada.

| Item | Situação | Evidência |
|---|---|---|
| Direcional de quatro botões | **Inserido** | `#touchDpad` com quatro `.dpad-btn` |
| Botões dentro da tela do jogo | **Inserido** | `#touchControls` dentro de `.game-client` |
| Andar segurando um botão | **Inserido** | `pointerdown` / `pointerup` + `touchVector` |
| Diagonal com dois dedos | **Inserido** | Mapa de ponteiros `touchPointers` |
| Soltar fora do botão não trava | **Inserido** | `pointerup` global, `pointercancel` e `lostpointercapture` |
| Toque antigo sem Pointer Events | **Coberto** | Fallback `touchstart` / `touchend` |
| Botão pressionado tem feedback visual | **Inserido** | Classe `.pressed` e estado `:active` |
| Movimento para ao abrir menu/batalha | **Inserido** | `resetTouchDirections()` quando o jogo pausa |
| Detecção automática no Android | **Inserida** | `maxTouchPoints` + `pointer: coarse` |
| Reativação em celulares com save antigo | **Inserida** | `touchControlsVersion = 2` |
| Ativar/desativar manualmente | **Inserido** | Menu do Jogo → Interface → Botões direcionais |
| Botão **Continuar** nas mensagens | **Mantido** | `#toastNext` |
| Botão **Cancelar** nas mensagens | **Mantido** | `#toastCancel` |
| Fila de mensagens | **Mantida** | `toastQueue` / `advanceToast()` |
| Ajuda e README atualizados | **Inserido** | Tópico “Android, botões direcionais e mensagens” |

## Como testar no Android

1. Abra o jogo no celular, em retrato ou paisagem.
2. Entre na conta e escolha o inicial.
3. Confirme que os quatro botões aparecem **sobre a tela do jogo**, à esquerda.
4. Segure **▲**, **◀**, **▶** ou **▼** para andar; solte para parar.
5. Segure dois botões ao mesmo tempo para andar na diagonal.
6. Abra um menu ou uma batalha e confirme que o treinador para sem ficar preso.
7. Se os botões não aparecerem, abra **Menu do Jogo → Interface → Botões
   direcionais**.
8. Salve o jogo ou colete um item para gerar uma mensagem.
9. Toque na mensagem ou em **Continuar**; use **Cancelar** para fechar e limpar
   a fila.

## Validação técnica

- `test_logic.js`: **passou**
- `test_cloud.js`: **passou**
- `test_hud.js`: **passou**, incluindo eventos reais de `pointerdown` /
  `pointerup`, movimento, diagonal, pausa e alternância pelo menu
- HTML publicado contém `#touchControls`, `#touchDpad`, quatro `.dpad-btn`,
  `#toastNext` e `#toastCancel`
- JavaScript publicado contém `pressTouchDirection`,
  `releaseTouchDirection`, `resetTouchDirections` e `applyTouchControls`
- `index.html` e `index_new.html` estão sincronizados

> Observação: a conferência foi feita por inspeção do DOM, testes automatizados
> e verificação do código publicado. O navegador de captura de tela deste
> ambiente não abriu nesta rodada.
