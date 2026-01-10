<div class="banner">
    <i class="ri-tools-line"></i>
    <span>Site under construction - Updates coming soon!</span>
</div>

<style>
    .banner {
        background: linear-gradient(135deg, rgba(255, 166, 0, 0.15), rgba(255, 90, 0, 0.15));
        backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(255, 166, 0, 0.3);
        color: #ffa500;
        margin-top: 6vh;
        padding: 0.5rem 1rem;
        text-align: center;
        font-size: 0.875rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        font-family: 'Mozilla Text', sans-serif;
        position: relative;
        z-index: 100;
    }

    .banner i {
        font-size: 1.1rem;
    }

    .banner span {
        font-weight: 300;
    }

    @media (max-width: 640px) {
        .banner {
            font-size: 0.75rem;
            padding: 0.4rem 0.75rem;
        }

        .banner i {
            font-size: 1rem;
        }
    }
</style>
