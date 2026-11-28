# Experience regression check

Run from the repository root:

    node tests/experience.test.cjs

No installed packages are needed. The harness executes the actual game and experience scripts against a deterministic DOM, clock and Web Audio mock. It covers two rounds of compressions, AED transitions, short input events, reset, mode separation, depth signal retention, unmeasured-depth labels, sound mute, audio scheduling and voice ducking.

Browser visual QA is separate. Physical Makey Makey switches, USB distance sensor calibration, speaker loudness and the installed Cantonese voice still require the actual exhibit equipment.

The fading-colour theme checks verify that presentation effects never mutate game or hardware state, animation pooling stays bounded, soft motion cancels active effects, reset restores the scene, and ending colours follow the existing result. Both 60×2 guided and 90×2 real-mode rounds are covered, including early AED inputs.

The theatre checks also cover timed scene-local pouring, water level, discomfort pose, the intermediate fall pose, resets during performance, reduced-motion handling and the integrity of all six generated WAV samples. Use `node assets/build-foley.cjs` to rebuild the original synthesized material sounds.

Motion checks exercise 100 rapid feedback events, verify the effect pool stays bounded, ensure reset clears animations, and check both the in-game motion toggle and the operating-system reduced-motion preference. Effects never gate gameplay or capture pointer input. Real mode uses neutral input feedback without revealing compression quality.
