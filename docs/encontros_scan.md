# Encontros selvagens, biomas e Scanner

Este documento descreve o sistema de captura por **Scan** do Folkmons: batalhas
aleatórias na grama alta, pools por bioma, ganho de dados por estágio evolutivo
e conversão em Folkmom ao chegar a 100%.

## Visão geral

1. O jogador entra em uma área de **grama alta** e anda.
2. Cada tile novo tem chance de iniciar uma batalha selvagem.
3. O bioma define os elementos e a distribuição de estágios dos encontros.
4. A tela de batalha mostra uma **barrinha de Scan**, o percentual já acumulado
   e quanto aquela espécie rende ao vencer.
5. Ao vencer, o Scan da espécie sobe conforme o estágio evolutivo.
6. Ao chegar a **100% ou mais**, o jogador gera o Folkmom:
   - pelo botão na tela de vitória; ou
   - pelo **Scanner Folclórico** (tecla **E**).
7. A geração consome 100% do Scan e mantém o excedente.
8. O Folkmom gerado entra no time no nível 5, com PV cheio, se houver espaço.

O sistema é inspirado na ideia de acumular dados de criaturas e converter esses
dados em um parceiro, sem usar nomes, sprites ou assets de outras franquias.

## Biomas

O mapa tem cinco manchas de grama alta, distribuídas em três biomas:

| Bioma | Elementos favorecidos | Peso dos estágios | Nível |
| --- | --- | --- | --- |
| **Caatinga** | Fogo, Terra, Trevas, Elétrico | 64% / 28% / 8% | +1 |
| **Cerrado** | Grama, Fogo, Terra, Vento | 67% / 26% / 7% | +1 |
| **Mata Ciliar** | Água, Grama, Vento | 68% / 26% / 6% | +0 |

- Os pesos são, respectivamente, **básico / evoluído / final**.
- O nível selvagem parte do nível do primeiro Folkmom saudável do time e recebe
  um ajuste de estágio: **+4** para evoluído e **+8** para final (mais um
  pequeno sorteio de -1 a +1).
- A HUD mostra o nome do bioma quando o treinador está na grama alta.
- As cores da grama e a ficha do Scanner identificam cada bioma.

### Chance de encontro

A chance por tile novo começa em **14%** e sobe **2% por tile consecutivo** na
grama, até **34%**. Depois de uma batalha, há um intervalo de segurança de 6
tiles. O contador zera ao sair da grama. O jogador nunca é surpreendido com o
menu aberto, no meio de outra batalha ou sem nenhum Folkmom saudável.

## Estágios evolutivos e ganho de Scan

O estágio é calculado a partir do grafo de evoluções de `folkmons_data.js`:

- **Básico** (sem forma anterior): **+30%** por vitória.
- **Evoluído** (uma evolução): **+18%** por vitória.
- **Final** (duas evoluções): **+10%** por vitória.

Assim, Folkmons mais fracos completam o Scan mais rápido, enquanto formas finais
exigem mais batalhas. O limite de armazenamento é **200%** por espécie. Ao
gerar, 100% são consumidos; o restante fica para a próxima conversão.

### Exemplos

| Forma | Estágio | Ganho | Batalhas para 100% |
| --- | --- | --- | --- |
| Mandingueiro (`FM001`) | Básico | +30% | 4 |
| Bruxo Sertanejo (`FM001A`) | Evoluído | +18% | 6 |
| Pai-de-Santo das Sombras (`FM001B`) | Final | +10% | 10 |

Os números são aproximados porque o excedente é preservado: quatro vitórias de
Mandingueiro geram 120%, permitindo uma conversão e deixando 20%.

## Persistência

O progresso fica em `player.scanData`:

```js
{
  "FM001": 72,
  "FM001A": 118
}
```

- A chave é o ID da forma encontrada.
- O valor é o percentual acumulado (0–200).
- `normalizePlayer()` descarta IDs inválidos e limita os valores.
- O save local e o save na nuvem incluem `scanData` automaticamente.
- `player.stats.scans` conta amostras ganhas em vitórias; `captures` conta
  Folkmons gerados.

## Interface

### Tela de batalha

O painel do inimigo ganhou:

- título **SCAN** e percentual atual;
- barra que fica verde ao atingir 100%;
- dica com **+X% ao vencer** e o estágio;
- ao vencer, a barra atualiza e aparece um resumo com o total.

### Scanner Folclórico

O botão **Scan** da HUD e a tecla **E** abrem o Scanner. Ele mostra:

- quantos Scans estão prontos;
- quantas espécies têm dados;
- total de amostras e ocupação do time;
- os três biomas e seus elementos;
- um cartão por espécie, com sprite, elemento, estágio, ganho por vitória,
  barra de progresso e botão **Gerar** quando estiver em 100%;
- o excedente e a regra de nível 5.

Se o time estiver cheio, o botão fica desabilitado e o Scan continua guardado.

## Fluxo resumido

```text
Grama alta
   ↓ (chance por tile)
Batalha selvagem do bioma
   ↓ (vitória)
Scan da espécie += 30 / 18 / 10
   ↓ (>= 100%)
Botão Gerar na vitória ou Scanner
   ↓ (consome 100%)
Folkmom Lv.5 no time
```

## Testes

Os testes em `/tmp/opencode/jsdomtest` cobrem:

- presença de grama alta e dos três biomas;
- pool de encontro coerente com o bioma;
- ganhos de Scan 30/18/10;
- encontro iniciado ao pisar em grama alta;
- painel de Scan na batalha;
- vitória que ultrapassa 100%, geração e preservação do excedente;
- Scanner vazio, cartões, botão Gerar, time cheio e HUD com bioma.

Comandos:

```bash
cd /tmp/opencode/jsdomtest
node test_logic.js
node test_cloud.js
node test_hud.js
```
