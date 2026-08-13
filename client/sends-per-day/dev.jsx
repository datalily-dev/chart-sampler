/**
 * Vite-only entry. Production still bundles `main.jsx` with esbuild.
 * CSS is imported here so edits hot-reload instead of sitting in publicDir.
 */

import '../../static/tokens.css';
import '../../static/components.css';
import '../../static/demo.css';
import './main.jsx';
