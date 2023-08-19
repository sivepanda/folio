<script context="module">
     /**Triggered when element is in viewport
     * @param el - parameter being watched
     */
     export function elementInViewport(el) {

        var top = el.offsetTop;
        var left = el.offsetLeft;
        var width = el.offsetWidth;
        var height = el.offsetHeight;

        while (el.offsetParent) {
            el = el.offsetParent;
            top += el.offsetTop;
            left += el.offsetLeft;
        }

        return (
            top >= window.scrollY &&
            left >= window.scrollX &&
            (top + height) <= (window.scrollY + window.innerHeight) &&
            (left + width) <= (window.scrollX + window.innerWidth)
        );
    }
</script>