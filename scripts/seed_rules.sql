INSERT INTO "rules" ("id", "organisation_id", "name", "description", "type", "config", "is_managed", "created_at", "updated_at") VALUES

  -- 1. 3-Sigma Outlier Detection
  (gen_random_uuid(), NULL,
   '3-Sigma Outlier Detection',
   'Flags data points that exceed 3 standard deviations from the rolling mean. Industry-standard anomaly detection for sensor telemetry.',
   'STATISTICAL',
   '{"stdDevMultiplier": 3, "windowSamples": 100}',
   true, now(), now()),

  -- 2. 2-Sigma Soft Alert
  (gen_random_uuid(), NULL,
   '2-Sigma Soft Alert',
   'Raises a warning (not failure) when values cross 2 standard deviations. Use alongside 3-Sigma for a tiered alerting system.',
   'STATISTICAL',
   '{"stdDevMultiplier": 2, "windowSamples": 100, "severity": "warning"}',
   true, now(), now()),

  -- 3. Sensor Flatline Monitor
  (gen_random_uuid(), NULL,
   'Sensor Flatline Monitor',
   'Detects a stuck or dead sensor. Alerts if the signal variance is below threshold for 50 or more consecutive samples.',
   'AVAILABILITY',
   '{"varianceThreshold": 0.0001, "consecutiveSamples": 50}',
   true, now(), now()),

  -- 4. Missing Data Gap
  (gen_random_uuid(), NULL,
   'Missing Data Gap',
   'Alerts if no new data points are received from a channel for more than 10 seconds. Indicates a connectivity or transport failure.',
   'AVAILABILITY',
   '{"maxGapSeconds": 10}',
   true, now(), now()),

  -- 5. Value Out of Range
  (gen_random_uuid(), NULL,
   'Value Out of Range',
   'Generic lower and upper bound check. Default bounds are very wide (-9999 to 9999). Override config.min and config.max for your sensor.',
   'THRESHOLD',
   '{"min": -9999, "max": 9999}',
   true, now(), now()),

  -- 6. Rate of Change Spike
  (gen_random_uuid(), NULL,
   'Rate of Change Spike',
   'Detects sudden jumps between consecutive samples. Alerts when the absolute delta exceeds 5 standard deviations of the expected rate of change.',
   'STATISTICAL',
   '{"rateOfChange": true, "stdDevMultiplier": 5, "windowSamples": 50}',
   true, now(), now());
