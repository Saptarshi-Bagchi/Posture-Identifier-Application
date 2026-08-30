/*
  ISPA MQTT telemetry shape
  Publish to: posture/<device_id>/telemetry
  Payload: {"device_id":"esp32-01","posture_state":"POSTURE_NEUTRAL_GOOD","angle":4.2,"timestamp":"2026-08-30T12:00:00Z"}

  When the ISPA broker binds a LAN address, use MQTT username "device" and
  the password set in MQTT_DEVICE_PASSWORD on the desktop running ISPA.
  Subscribe to posture/<device_id>/command to receive "close_lid".
*/
