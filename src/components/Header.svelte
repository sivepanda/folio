<div class="header">
    <svg version="1.1" id="svg10" viewBox="0 0 614 345" fill="white">
        <path
            style="stroke-width:4px;stroke:red;fill:transparent;"
            d="M 445.48828,82.320312 170.62695,110.33398 v 150.24219 l 155.03711,-15.82422 v -68.55859 l 100.24414,-10.63672 0.30274,-57.60156 -231.42774,22.61719 v 56.1289 l 106.08399,-10.56445 v 57.86523 L 184.04687,246.53711 V 122.58594 L 434.50586,97.070312 v 75.759768 l -99.58203,10.04687 v 40.91016 h 1.59961 v -39.46289 l 99.58203,-10.04688 V 95.298828 L 182.44727,121.14063 V 248.31836 L 302.4668,235.43945 v -61.07031 l -106.08399,10.56445 v -52.91015 l 228.22071,-22.30469 -0.28907,54.39844 -100.25,10.63672 v 68.55273 L 172.22656,258.80469 V 111.7793 L 443.88867,84.091797 V 183.9082 l -98.10547,9.5293 v 19.12109 h 1.59961 v -17.66797 l 98.10547,-9.52929 z"
            id="path25"
        />
    </svg>
    <div class="right">
        <a href="/">Home</a>
        <a href="/">Dev</a>
        <a href="/">Photography</a>
    </div>
</div>

<style>
    .header {
        font-family: 'Urbanist', 'sans-serif';
        font-weight: 650;
        background: linear-gradient(
            rgba(31, 31, 46, 1),
            rgba(31, 31, 46, 0.7) 50%,
            rgba(0, 0, 0, 0)
        );
        backdrop-filter: blur(20px);
        height: 12vh;
        width: 100vw;
        position: fixed;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }
    .right {
        display: flex;
        padding-right: 2vw;
        flex-direction: row;
    }
    .right a {
        display: block;
        align-self: center;
        font-size: 3svh;
        text-decoration: none;
        color: white;
        margin: 0;
        padding: 0;
        padding-left: 2vw;
        transition: ease 0.7s;
    }
    .right a:hover {
        margin-top: 0vh;
        font-weight: 950;
        /* margin-bottom: 2vh; */
        color: gray;
        transition: cubic-bezier(0.57, -0.01, 0, 0.72) 200ms;
    }
</style>
