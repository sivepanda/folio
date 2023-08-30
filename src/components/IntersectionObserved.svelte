<script context="module" lang="ts">
     /**Triggered when element is in viewport
     * @param el - parameter being watched
     */
     function elementInViewport(el) {

        var top = el.offsetTop;
        var left = el.offsetLeft;
        var width = el.offsetWidth;
        var height = el.offsetHeight;

        while (el.offsetParent) {
            top += el.offsetParent.offsetTop;
            left += el.offsetParent.offsetLeft;
        }

        return (
            top >= window.scrollY &&
            left >= window.scrollX &&
            (top + height) <= (window.scrollY + window.innerHeight) &&
            (left + width) <= (window.scrollX + window.innerWidth)
        );
    }

    export function useScrollAction(node) {
            document.addEventListener("scroll", (e) => {
                // if(elementInViewport(node)) {
                //     // node?.classList.toggle("anihero");
                //     console.log('hey')
                // }
                console.log('yo')
            });
    }
</script>