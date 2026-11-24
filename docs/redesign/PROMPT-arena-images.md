# Brief: generate the site's AI photos on arena.ai

The user is at the computer and will approve prompts. Work in your own Tether window.

## Read first
- `C:\Users\SLAT\Documents\docs\bs-eximnexus\docs\redesign\IMAGE-PROMPTS.md`: the 8 images, their file names, and the shared style line.

## Steps
1. `start_session` (reason: "generate website photos on arena.ai") and open https://arena.ai/ . Find its image-generation mode (text-to-image).
2. If the site asks to sign in, accept terms or cookies, or solve a CAPTCHA: call `wait_for_user` with a short message and let the user handle it. Never create accounts, never enter passwords, never accept terms yourself. Decline non-essential cookies if a banner asks.
3. For each row in IMAGE-PROMPTS.md, in order:
   - Enter the row's prompt followed by the shared style line, and generate.
   - If two or more images come back, pick the one that looks most like a real photograph and matches the prompt (correct colours, no text, no artefacts, no warped objects). If none is good, regenerate once.
   - Save the chosen image to `C:\Users\SLAT\Documents\docs\bs-eximnexus\public\photos\` using the row's file name (keep the original format's extension if it is not webp, e.g. `textiles.png`). Use `save_media` or `download_file`.
4. Stay on arena.ai. Do not visit other sites. Do not post, share or publish anything.
5. `end_session` when done.

## Report
Write `C:\Users\SLAT\Documents\docs\bs-eximnexus\docs\redesign\IMAGE-RESULTS.md`: one line per image with the saved path, which model produced it (if shown), and a one-line note on quality. List any image you could not get and why.
