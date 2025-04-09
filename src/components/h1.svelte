<script>
  export let text = 'Hello World';
  export let fontSize = 24;
  export let strokeColor = 'blue';
  export let fillColor = 'blue';
</script>

<svg viewBox="0 0 100 100">
  <text>
    <textPath id="textPath" font-size={fontSize} style="stroke: {strokeColor}; --fillcol: {fillColor}">
      {text}
    </textPath>
  </text>
</svg>

<style>
  svg {
    width: 400px;
    height: 100px;
  }
  
  #textPath {
    fill: none;
    stroke-width: 1;
    stroke-dasharray: 500;
    stroke-dashoffset: 500;
  }

  #textPath:hover {
    animation: trace 2s linear forwards, fill 1s linear 2s forwards;
  }
  
  @keyframes trace {
    to {
      stroke-dashoffset: 0;
    }
  }
  
  @keyframes fill {
    from {
      fill: none;
    }
    to {
      fill: var(--fillcol);
    }
  }
</style>