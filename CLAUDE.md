# CLAUDE.md — Brown-Hilbert Adapter

This file exists only as a compatibility entrypoint for Claude-family runtimes.

Immediate action:

1. If you are booting as Jesse's absolute top orchestrator, read `00-TOP-AGENT-PRECOMMAND.md` first.
2. Read `BROWN-HILBERT.md` before any other action.
3. If the job needs the current most advanced public language, read `specs/49d-proposal/brown-hilbert-49D-expansion-map.public.json` and `projections/maps/hyperglyph-map.public.v1.json` next. The live runtime still carries 47 catalogs; `D48/D49` remain proposal overlay only until signed.
4. If the task touches `MiniMax-AI` or `MiniMax-M2.7`, load `projections/catalogs/minimax.public-catalog.v1.json`, `examples/minimax-m27/MiniMaxM27NamedWave.public.md`, `specs/hb/hypercube-49d.public.schema.json`, and `examples/minimax-m27/hg256-minimax-catalog-ingest.public.packet.json` before execution.
5. Read `AGENTS.md` for local safety and workspace operating rules.
6. If any Claude-specific assumption conflicts with `BROWN-HILBERT.md`, the Brown-Hilbert file wins.
7. For Brown-Hilbert canon work, follow the agent-first scan doctrine in `brown-hilbert\03-operating-model.md`.

This file should stay thin. The canon lives in `BROWN-HILBERT.md`, and private runtime boot paths are intentionally omitted from this public adapter.

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
