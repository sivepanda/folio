<script>
    import { onDestroy, onMount } from "svelte";

    export let tag = 'div';

    /**
	 * @type {Element}
	 */
    let element;
    /**
	 * @type {IntersectionObserver}
	 */
    let observer;

    /**
	 * @param {any[]} entries
	 */
    function onIntersect(entries) {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                console.log("element in viewport")
            }
        });
    }

    onMount(() => {
        observer = new IntersectionObserver(onIntersect, {
            root: null,
            threshold: 0.5
        })

        if(element) {
            observer.observe(element);
        }
    });

    onDestroy(() => {
        if(element) {
            observer.unobserve(element)
        }
    })

  </script>
  
  <svelte:element class="io" bind:this={element} this={tag} {...$$restProps}>
      <slot></slot>
  </svelte:element>

  <style>
    .io {
        margin: 0;
        padding: 0;
    }
  </style>
