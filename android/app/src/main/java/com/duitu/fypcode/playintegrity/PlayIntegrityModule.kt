package com.duitu.fypcode.playintegrity

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.google.android.play.core.integrity.IntegrityManagerFactory
import com.google.android.play.core.integrity.IntegrityTokenRequest

class PlayIntegrityModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "PlayIntegrity"
    }

    @ReactMethod
    fun requestIntegrityToken(nonce: String, promise: Promise) {
        val integrityManager = IntegrityManagerFactory.create(reactApplicationContext)

        val integrityTokenRequest = IntegrityTokenRequest.builder()
            .setNonce(nonce)
            .build()

        integrityManager.requestIntegrityToken(integrityTokenRequest)
            .addOnSuccessListener { response ->
                val token = response.token()
                promise.resolve(token)
            }
            .addOnFailureListener { exception ->
                promise.reject("INTEGRITY_ERROR", exception.message, exception)
            }
    }
}
