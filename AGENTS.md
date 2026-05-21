# AGENTS.md — Brown-Hilbert Entry Surface

Read `BROWN-HILBERT.md` first.

This file is the compatibility surface for tools and agents that auto-load `AGENTS.md`. It is not the identity canon.

## Public-safe boot path

1. Read `BROWN-HILBERT.md`.
2. Treat `47D` as the live public base.
3. Treat `49D` as proposal-only until formally signed.
4. If the task touches `MiniMax-AI` or `MiniMax-M2.7`, use the tracked public references:
   - `projections/catalogs/minimax.public-catalog.v1.json`
   - `examples/minimax-m27/MiniMaxM27NamedWave.public.md`
   - `examples/minimax-m27/hg256-minimax-catalog-ingest.public.packet.json`
5. Use `CODEX.md` or `CLAUDE.md` only as thin runtime adapters.

## Authority split

- `BROWN-HILBERT.md` governs identity, boot order, authority, and civilization law.
- `AGENTS.md` is only a compatibility entry surface.

Private runtime boot paths, local topology, and operator-only safety rules are intentionally omitted from this public adapter.

Use o repo canonico https://github.com/wesleysimplicio/yool-tuple-hamt. 
Leia antes de editar: YOOL_TUPLE_HAMT.md, kernel/yool_tuple_kernel.py,
guardrails/cpu_throttle.py, guardrails/disk_gc.py, examples/python/receipts.py
e scripts/build_hamt.py.

Ao receber "Implement X": decomponha em grafo Hilbert-indexed, crie tuple raiz,
use batch_spawn(depth, branching, compression_threshold) para 1.000.000+
subagents sem enumerar, execute work ativo com spawn_agent, roteie por out/in/rd,
route_packet e scan_index, aplique hookwall, compress_token e prune_idle, e use
LaneWorkerPool respeitando YOOL_TUPLE_* env vars.

Execute:
python kernel/yool_tuple_kernel.py

Responda SEMPRE exatamente neste formato (sem varia??es):
[Tuple Space Snapshot] 
[Active Agents/Subagents]
[Total Agents/Subagents]
[Pr?ximo Yool a executar]
[Resultado parcial]
