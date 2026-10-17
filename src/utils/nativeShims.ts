/**
 * ============================================================================
 *  nativeShims.ts — Polyfills for Expo Go & Safe Headless Execution
 *  Author: FinSarathi AI & Systems Architecture Team
 *  Purpose:
 *    When running inside Expo Go, native C++/JSI binaries like Microsoft ONNX Runtime
 *    (`onnxruntime-react-native`) are not compiled into Expo Go's prebuilt APK.
 *
 *    In React Native New Architecture (TurboModules), `NativeModules` is a read-only
 *    C++ Proxy that throws if mutated ("Tried to insert a NativeModule into the
 *    bridge's NativeModule proxy").
 *
 *    Therefore, we polyfill `globalThis.OrtApi` directly on standard JavaScript
 *    `globalThis`. This prevents `onnxruntime-react-native`'s `binding.ts` from
 *    ever invoking `Module.install()`, while keeping `NativeModules` completely untouched.
 * ============================================================================
 */

// Polyfill global OrtApi if not already injected by native JSI
if (typeof (globalThis as any).OrtApi === 'undefined') {
  (globalThis as any).OrtApi = {
    listSupportedBackends: () => [],
    createSession: async () => {
      throw new Error(
        'Native ONNX JSI Runtime is not available in Expo Go. FinSarathi is operating with its resilient on-device classification engine.'
      );
    },
  };
}
