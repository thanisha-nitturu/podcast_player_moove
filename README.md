# Persistent Podcast Player – Moodle (Moove Theme Integration)

This repository contains two files used to integrate a **persistent audio/podcast player** across Moodle pages, specifically for the **Moove theme**. This allows audio playback to continue seamlessly across navigations.

---

## 📂 Files Included

### ✅ `footer.mustache`  
- Location to place:  
  `/var/www/html/moodle/theme/moove/templates/footer.mustache`

- Purpose:  
  This file injects the persistent player markup and links the player script. It overrides the default Moove theme footer to include the audio player container at the base of every Moodle page.

---

### ✅ `persistent_player.js`  
- Location to place:  
  `/var/www/html/moodle/theme/moove/amd/src/persistent_player.js`

- Purpose:  
  This JavaScript file handles the logic for audio playback, including:
  - Keeping audio persistent across navigation
  - Handling play/pause actions
  - Storing and restoring playback state

---

## ⚙️ Setup Instructions

1. **Place the files** in their respective directories (see above).
2. **Rebuild Moodle JavaScript** using the following CLI command:
   ```bash
   sudo npx grunt amd
   purge cahces in the webiste site administrations>Development>purge caches

