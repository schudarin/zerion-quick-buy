// Zerion Quick Buy Banner Module (Phase A)
// During phase A we simply provide a wrapper so other scripts can call
// `createZerionBanner(info)` while the real implementation still lives
// in content.js.  In phase B the full banner code will be moved here and
// `_internalBuildBanner` will be defined inside this file.

;(function (global) {
  if (global.createZerionBanner) return // already present

  /**
   * Public entry-point used by content.js after parsing token info.
   * For now it delegates to the legacy buildBanner defined in content.js.
   * @param {object} info – parsed token info
   */
  function createZerionBanner(info) {
    if (typeof global._internalBuildBanner === "function") {
      return global._internalBuildBanner(info)
    }
    // Fallback / soft-fail in phase A until code is migrated.
    if (typeof global.buildBanner === "function") {
      return global.buildBanner(info)
    }
    console.warn("[ZQB] createZerionBanner called but implementation not found")
    return null
  }

  // Expose to global scope
  global.createZerionBanner = createZerionBanner
})(typeof window !== "undefined" ? window : this)
