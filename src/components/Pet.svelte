<script lang="ts">
  // O bichinho em SVG. Mesmo desenho de PetView.swift: as medidas são frações do tamanho.
  import type { PetMood, PetStage } from '../lib/game';
  import {
    appearance,
    babyAppearance,
    eggSpikes,
    mix,
    moodTitle,
    mouthCurve,
    petColors,
    stageScale,
    stageTitle,
    systemColors,
  } from '../lib/pet';

  interface Props {
    stage: PetStage;
    mood: PetMood;
    color: string;
    size?: number;
    /** Desligue em tamanhos pequenos para economizar animações. */
    animated?: boolean;
  }

  let { stage, mood, color, size = 200, animated = true }: Props = $props();

  const uid = $props.id();
  const reducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const moving = $derived(animated && !reducedMotion);

  const base = $derived(petColors[color] ?? petColors.green);
  const body = $derived(mood === 'sick' ? mix(base, systemColors.gray, 0.45) : base);
  const look = $derived(appearance(stage) ?? babyAppearance);
  const w = $derived(look.bodyWidth);
  const h = $derived(look.bodyHeight);
  // Corpos mais altos que o do Filhote (0.7) descem a barriga e o rosto.
  const extra = $derived(h - 0.7);
  // Centro do corpo e do enfeite, como no VStack do app (sempre 0.05 abaixo do centro).
  const bodyY = 0.05;
  const accessoryY = $derived(-h / 2 + 0.01);
  const bobBottom = $derived((h + 0.14) / 2);

  const eyeH = $derived(mood === 'sad' ? 0.09 : 0.12);
  const faceY = $derived(-(0.06 - extra * 0.3));
  const faceH = $derived(eyeH + 0.05 + 0.07);
  const eyesY = $derived(faceY - faceH / 2 + eyeH / 2);
  const mouthY = $derived(faceY + faceH / 2 - 0.035);
  const curve = $derived(mouthCurve[mood] ?? 0);

  const earH = $derived(look.ears === 'long' ? 0.3 : 0.2);

  // Curvas suaves das animações (ease-in-out).
  const ease = '0.42 0 0.58 1';

  /** Caminho da orelha (gota pontuda) num retângulo com a base embaixo. */
  function earPath(x: number, y: number, width: number, height: number) {
    return `M${x} ${y + height} Q${x} ${y + height * 0.3} ${x + width / 2} ${y} Q${x + width} ${y + height * 0.3} ${x + width} ${y + height}Z`;
  }

  /** Espinho com ponta arredondada, centrado na origem e apontando para cima. */
  function spikePath(width: number, height: number) {
    const x = -width / 2;
    const y = -height / 2;
    return `M${x} ${y + height} Q${x + width * 0.3} ${y + height * 0.4} 0 ${y} Q${x + width * 0.7} ${y + height * 0.4} ${x + width} ${y + height}Z`;
  }

  const spikes = eggSpikes.map((spike) => {
    const radians = (spike.angle * Math.PI) / 180;
    const distance = spike.length / 2 - 0.025;
    return {
      ...spike,
      x: (0.29 + distance) * Math.sin(radians),
      y: -(0.375 + distance) * Math.cos(radians),
    };
  });

  const s = 0.32;
  const wingPath = `M${s / 2} ${s * 0.25} Q${-s / 2 + s * 0.05} ${s * 0.4} ${-s / 2} ${-s / 2 + s * 0.05} Q${-s / 2 + s * 0.2} ${-s / 2 + s * 0.1} ${-s / 2 + s * 0.35} ${-s / 2 + s * 0.3} Q${-s / 2 + s * 0.75} ${-s / 2} ${s / 2} ${s * 0.25}Z`;
  const t = 0.22;
  const tailPath = `M${-t / 2} ${-t / 2 + t * 0.8} Q${-t / 2 + t * 0.7} ${t / 2} ${-t / 2 + t * 0.8} ${-t / 2 + t * 0.3} Q${t / 2} ${-t / 2} 0 ${-t / 2 + t * 0.1}`;

  const sparkles = [
    { x: -0.42, y: -0.3, scale: 1 },
    { x: 0.4, y: -0.36, scale: 0.7 },
    { x: 0.44, y: 0.1, scale: 0.9 },
    { x: -0.45, y: 0.12, scale: 0.6 },
  ];

  /** Faísca de quatro pontas. */
  function sparklePath(r: number) {
    const k = r * 0.25;
    return `M0 ${-r} Q${k} ${-k} ${r} 0 Q${k} ${k} 0 ${r} Q${-k} ${k} ${-r} 0 Q${-k} ${-k} 0 ${-r}Z`;
  }

  /** Estrela de cinco pontas com raio externo `r`. */
  function starPath(r: number) {
    const points = Array.from({ length: 10 }, (_, index) => {
      const radius = index % 2 === 0 ? r : r * 0.45;
      const angle = (Math.PI / 5) * index - Math.PI / 2;
      return `${(radius * Math.cos(angle)).toFixed(4)} ${(radius * Math.sin(angle)).toFixed(4)}`;
    });
    return `M${points.join(' L')}Z`;
  }

  /** Escudo com largura `r * 2`. */
  function shieldPath(r: number) {
    return `M0 ${-r} L${r} ${-r * 0.6} L${r * 0.85} ${r * 0.25} Q${r * 0.5} ${r * 0.85} 0 ${r * 1.1} Q${-r * 0.5} ${r * 0.85} ${-r * 0.85} ${r * 0.25} L${-r} ${-r * 0.6}Z`;
  }
</script>

<svg
  class="pet"
  viewBox="-0.5 -0.5 1 1"
  width={size}
  height={size}
  role="img"
  aria-label="Bichinho {stageTitle[stage]}, {moodTitle[mood]}"
>
  <defs>
    <linearGradient id="{uid}-body" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color={mix(body, '#ffffff', 0.35)} />
      <stop offset="1" stop-color={body} />
    </linearGradient>
    <linearGradient id="{uid}-shell" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" />
      <stop offset="1" stop-color={base} stop-opacity="0.35" />
    </linearGradient>
    <linearGradient id="{uid}-spike" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color={mix(base, '#000000', 0.1)} />
      <stop offset="1" stop-color={mix(base, '#ffffff', 0.3)} />
    </linearGradient>
    <linearGradient id="{uid}-wing" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color={mix(base, '#ffffff', 0.75)} />
      <stop offset="1" stop-color={mix(base, '#ffffff', 0.35)} />
    </linearGradient>
    <linearGradient id="{uid}-gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color={systemColors.yellow} />
      <stop offset="1" stop-color={systemColors.orange} />
    </linearGradient>
    <radialGradient id="{uid}-aura">
      <stop offset="0" stop-color={systemColors.yellow} stop-opacity="0.35" />
      <stop offset="1" stop-color={systemColors.yellow} stop-opacity="0" />
    </radialGradient>
  </defs>

  {#if stage === 'egg'}
    <!-- Ovo pintado que balança, com espinhos atrás da casca. -->
    <ellipse cx="0" cy="0.4" rx="0.25" ry="0.04" fill="#000" opacity="0.12" />
    <g>
      {#if moving}
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="-5 0 0.375; 5 0 0.375; -5 0 0.375"
          dur="1.8s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="{ease}; {ease}"
        />
      {/if}
      {#each spikes as spike (spike.angle)}
        <path
          d={spikePath(0.11, spike.length)}
          fill="url(#{uid}-spike)"
          transform="translate({spike.x} {spike.y}) rotate({spike.angle})"
        />
      {/each}
      <ellipse cx="0" cy="0" rx="0.29" ry="0.375" fill="url(#{uid}-shell)" />
      <circle cx="-0.1" cy="-0.12" r="0.06" fill={base} opacity="0.5" />
      <circle cx="0.12" cy="0.02" r="0.04" fill={base} opacity="0.5" />
      <circle cx="-0.04" cy="0.18" r="0.05" fill={base} opacity="0.5" />
      <ellipse
        cx="0"
        cy="0"
        rx="0.29"
        ry="0.375"
        fill="none"
        stroke={base}
        stroke-opacity="0.4"
        stroke-width={2 / size}
      />
    </g>
  {:else}
    <g transform="translate(0 0.5) scale({stageScale[stage]}) translate(0 -0.5)">
      {#if look.hasAura}
        <!-- Aura dourada com faíscas do Lendário. -->
        <g>
          {#if moving}
            <animate attributeName="opacity" values="0.55;1;0.55" dur="3s" repeatCount="indefinite" />
            <animateTransform
              attributeName="transform"
              type="scale"
              values="0.96;1.04;0.96"
              dur="3s"
              repeatCount="indefinite"
            />
          {/if}
          <circle r="0.5" fill="url(#{uid}-aura)" />
          {#each sparkles as sparkle, index (index)}
            <path
              d={sparklePath(0.04 * sparkle.scale)}
              fill={systemColors.yellow}
              transform="translate({sparkle.x} {sparkle.y})"
            />
          {/each}
        </g>
      {/if}

      <!-- Sombra no chão -->
      <ellipse cx="0" cy="0.42" rx="0.3" ry="0.04" fill="#000" opacity="0.12" />

      <!-- Respiração: sobe um pouco e estica, com a base fixa. -->
      <g>
        {#if moving}
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 0 -0.03; 0 0"
            dur="2.4s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="{ease}; {ease}"
          />
        {/if}
        <g transform="translate(0 {bobBottom})">
          <g>
            {#if moving}
              <animateTransform
                attributeName="transform"
                type="scale"
                values="1.02 0.98; 0.98 1.02; 1.02 0.98"
                dur="2.4s"
                repeatCount="indefinite"
                calcMode="spline"
                keySplines="{ease}; {ease}"
              />
            {/if}
            <g transform="translate(0 {-bobBottom})">
              <g transform="translate(0 {bodyY})">
                <!-- Partes de trás do corpo -->
                {#if look.hasWings}
                  {#each [-1, 1] as side (side)}
                    <g transform="translate({side * (w / 2 + 0.08)} -0.12)">
                      <g>
                        {#if moving}
                          <animateTransform
                            attributeName="transform"
                            type="rotate"
                            values="0 {side * -0.16} 0; {side * 12} {side * -0.16} 0; 0 {side * -0.16} 0"
                            dur="1.2s"
                            repeatCount="indefinite"
                            calcMode="spline"
                            keySplines="{ease}; {ease}"
                          />
                        {/if}
                        <path
                          d={wingPath}
                          transform="scale({side} 1)"
                          fill="url(#{uid}-wing)"
                          stroke={mix(base, '#000000', 0.15)}
                          stroke-width="0.012"
                        />
                      </g>
                    </g>
                  {/each}
                {/if}

                {#if look.ears !== 'none'}
                  {#each [-1, 1] as side (side)}
                    <g
                      transform="translate({side * w * 0.27} {-(h / 2 + earH / 2 - 0.08)}) rotate({side * 18} 0 {earH / 2})"
                    >
                      <path d={earPath(-0.085, -earH / 2, 0.17, earH)} fill={mix(body, '#ffffff', 0.2)} />
                      <path
                        d={earPath(-0.085 * 0.55, earH / 2 - earH * 0.55, 0.17 * 0.55, earH * 0.55)}
                        fill={systemColors.pink}
                        opacity="0.4"
                      />
                    </g>
                  {/each}
                {/if}

                {#if look.hasTail}
                  <path
                    d={tailPath}
                    transform="translate({w / 2 + 0.02} {h / 2 - 0.16})"
                    fill="none"
                    stroke={mix(body, '#000000', 0.1)}
                    stroke-width="0.07"
                    stroke-linecap="round"
                  />
                {/if}

                {#if look.hasArms}
                  <!-- Braço esquerdo parado e direito acenando. -->
                  <g transform="translate({-w / 2} 0.06) rotate(30 0 -0.1)">
                    <rect x="-0.05" y="-0.1" width="0.1" height="0.2" rx="0.05" fill={mix(body, '#000000', 0.08)} />
                  </g>
                  <g transform="translate({w / 2} 0.06)">
                    <g transform="rotate(-30 0 -0.1)">
                      {#if moving}
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          values="-30 0 -0.1; -30 0 -0.1; -140 0 -0.1; -30 0 -0.1"
                          keyTimes="0; 0.714; 0.857; 1"
                          dur="2.8s"
                          repeatCount="indefinite"
                        />
                      {/if}
                      <rect x="-0.05" y="-0.1" width="0.1" height="0.2" rx="0.05" fill={mix(body, '#000000', 0.08)} />
                    </g>
                  </g>
                {/if}

                <!-- Pezinhos -->
                {#each [-1, 1] as side (side)}
                  <ellipse
                    cx={side * 0.18}
                    cy={h / 2 - 0.03}
                    rx="0.07"
                    ry="0.05"
                    fill={mix(body, '#000000', 0.2)}
                  />
                {/each}

                <!-- Corpo -->
                <rect
                  x={-w / 2}
                  y={-h / 2}
                  width={w}
                  height={h}
                  rx={look.cornerRatio}
                  fill="url(#{uid}-body)"
                />

                <!-- Barriguinha, com emblema nas formas evoluídas -->
                <ellipse cx="0" cy={0.16 + extra * 0.5} rx="0.2" ry="0.13" fill="#fff" opacity="0.35" />
                {#if look.bellyEmblem}
                  <path
                    d={look.bellyEmblem === 'star' ? starPath(0.06) : shieldPath(0.05)}
                    transform="translate(0 {0.18 + extra * 0.5})"
                    fill={look.hasAura ? `url(#${uid}-gold)` : mix(body, '#000000', 0.25)}
                  />
                {/if}

                <!-- Rosto -->
                {#each [-0.14, 0.14] as x (x)}
                  <g transform="translate({x} {eyesY})">
                    {#if mood === 'sick'}
                      <path
                        d="M-0.03 -0.03 L0.03 0.03 M0.03 -0.03 L-0.03 0.03"
                        stroke="#000"
                        stroke-opacity="0.75"
                        stroke-width="0.022"
                        stroke-linecap="round"
                      />
                    {:else}
                      <g>
                        {#if moving}
                          <animateTransform
                            attributeName="transform"
                            type="scale"
                            values="1 1; 1 1; 1 0.1; 1 1"
                            keyTimes="0; 0.94; 0.97; 1"
                            dur="3s"
                            repeatCount="indefinite"
                          />
                        {/if}
                        <rect x="-0.04" y={-eyeH / 2} width="0.08" height={eyeH} rx="0.04" fill="#000" opacity="0.8" />
                        <circle cx="0.015" cy={-eyeH / 2 + 0.03} r="0.015" fill="#fff" />
                      </g>
                    {/if}
                  </g>
                {/each}

                {#if mood === 'happy'}
                  {#each [-0.215, 0.215] as x (x)}
                    <circle cx={x} cy={mouthY} r="0.035" fill={systemColors.pink} opacity="0.5" />
                  {/each}
                {/if}

                {#if mood === 'hungry'}
                  <ellipse cx="0" cy={mouthY} rx="0.045" ry="0.05" fill="#000" opacity="0.75" />
                {:else}
                  <path
                    d="M-0.09 {mouthY - (curve * 0.07) / 2} Q0 {mouthY + curve * 0.07} 0.09 {mouthY - (curve * 0.07) / 2}"
                    fill="none"
                    stroke="#000"
                    stroke-opacity="0.75"
                    stroke-width="0.025"
                    stroke-linecap="round"
                  />
                {/if}
              </g>

              <!-- Enfeite que aparece conforme evolui -->
              {#if look.headAccessory === 'leaf'}
                <g transform="translate(0 {accessoryY}) rotate(-20)">
                  <path
                    d="M0 0.07 Q-0.07 0 0 -0.07 Q0.07 0 0 0.07Z M0 0.07 L0 -0.05"
                    fill={mix(systemColors.green, '#000000', 0.2)}
                    stroke={mix(systemColors.green, '#000000', 0.4)}
                    stroke-width="0.006"
                  />
                </g>
              {:else if look.headAccessory === 'crown'}
                <path
                  d="M-0.1 0.05 L-0.1 -0.05 L-0.05 0 L0 -0.07 L0.05 0 L0.1 -0.05 L0.1 0.05Z"
                  transform="translate(0 {accessoryY - 0.01})"
                  fill="url(#{uid}-gold)"
                  stroke-linejoin="round"
                />
              {/if}
            </g>
          </g>
        </g>
      </g>
    </g>
  {/if}
</svg>

<style>
  .pet {
    overflow: visible;
    display: block;
  }
</style>
