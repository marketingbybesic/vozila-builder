# Domenska analiza polja po kategoriji (6 agenata, 2026-06-22)

Iscrpni istraživački output spremljen. KURIRANI sažetak (ne SVE što su agenti predložili — previše; kuriram na HR-tržište-korisno):

## Princip kuriranja
- Agenti predložili 50-100 polja po kategoriji. Zadržati ~15-30 NAJKORISNIJIH po kategoriji.
- column storage = postojeće Zod Listing kolone (NE dodavati nove kolone bez migracije). attr = jsonb (slobodno).
- Svako polje: searchable (filter) i/ili publishRequired (objava). Konzistentni keys search↔publish.
- subcategoryScope: polje se prikazuje samo za relevantne podkat.

## AUTO — zadržati
Postojeće + dodati: euroNorm(select), firstRegistered, registrationUntil, serviceHistory, importedFrom, numOwners.
EV (samo eko subcat): evRange, batteryCapacity, chargerType, hybridType, heatPump.
Oštećeni subcat: damageState(req), floodState, engineRuns, damageLocation.
Oldtimer subcat: restorationType, originalPaint.
Najam subcat: rentalType, dailyRate/monthlyRate.
GROUPS: Vrsta, Motor, Karoserija, Vrata i sjedala, Boja, Električna(eko), Oprema, Povijest, Ostalo.

## MOTO — zadržati (KURIRANO, agent predložio 100 — previše)
Vrsta: subcategory, motoCategory/Stil(motocikl/e-moto), atvClass(atv).
Motor: engineCc, powerKw, fuel, transmission, cylinders, stroke, drivetrain, coolingType.
EV (e-skuter/e-bicikl/e-moto): motorPowerW, batteryCapacityWh, rangeKm, maxSpeedEv, foldable, motorType.
ATV: driveAtvType(2x4/4x4), seatsAtvCount, towingHook, atvPurpose.
Sanke: trackLength, trackWidth, hullMaterial.
Pravno: licenceClass (AM/A1/A2/A).
Specifikacije: weight, seatHeight, fuelCapacity.
Oprema: abs, tempomat, navigacija, ledHeadlight, heatedGrips, windscreen, panniers, quickShifter.
Povijest: firstOwner, serviceRecords, damageState, garaged, registeredUntil.

## GOSPODARSKA — zadržati
Vrsta: subcategory, cargoBodyType(dostavna/kamioni), busType(autobusi), trailerType(prikolice).
Motor: fuel, transmission, powerKw, engineCc, euroNorm.
Specifikacije: gvwKg, payloadKg, axles, axleConfiguration, wheelbaseMm, cargoVolumeCbm, cargoLengthM, brakes(ABS/EBS).
Karoserija: seats, seatingCapacity(bus), standingCapacity(bus), rearDoors, sideDoors.
Oprema: climate, tahograph, crane, craneCapacity, loadingRamp, adr, retarder, wc(bus), tv(bus).
Boja, Povijest(ownership, damageState, registrationUntil, importedFrom), Ostalo(offerType, warranty, PDV).

## MEHANIZACIJA — zadržati (NEMA km/karoserija/vrata/sjedala)
Vrsta: subcategory, machineType(po subcat).
Motor: fuel, transmission(+Hidrostatski), powerKw, powerHp(KS).
Specifikacije UNIVERZALNO: operatingHours(radni sati - KLJUČNO), weightKg.
Bagri: workingMassT, diggingDepthM, reachM, bucketCapacityM3, tracks_vs_wheels.
Utovarivač/viličar: liftCapacityKg, liftHeightM, mastHeightRaisedM, tireType.
Kombajn: workingWidthM, bunkerCapacityL.
Traktor: drive4wd, pto, threePointHitch, cabinType, frontLoader.
Šumski: craneReachM, winchCapacityKg.
Komunalni: containerCapacityL, sweepingWidthM.
Oprema: climate(kabina), rops, fops, gps, quickCoupler.
Povijest: serviceHistory, ownership, damageState, registeredForRoad.
Najam: dailyRate, minRentalDays, operator, delivery.

## PROSTI-CAS — zadržati
Vrsta: subcategory, boatType(plovila), camperLayout(kamperi), eBikeType(e-bicikli).
Dimenzije: sleeps(ležajevi), lengthM, widthM, heightM, weightKg, axles(prikolice).
Motor kamper: fuel, transmission, km, powerKw (samo kamperi/mobilne s motorom).
Motor plovila: numEngines, engineHp, engineType, engineHours, hullMaterial, registered.
Motor e-bike/e-skuter: motorPowerW, batteryCapacityWh, rangeKm, maxSpeedKmh, foldable, frameSize, wheelSizeInch.
Udobnost: wc, shower, kitchen, refrigerator, heating(plin/dizel/Truma/Webasto), ac, solar, awning, tv, boiler, waterTankL, mover(prikolice).
Plovila: gps, autopilot, windlass.
Ostalo: offerType, warranty, serviceHistory, ownership, damageState.

## DIJELOVI — zadržati
Vrsta: subcategory.
Detalji: partType, condition2(novo/rabljeno/obnovljeno), compatibleWith(text), oem(text), brandPart(text), quantity.
Gume: tireWidth, tireProfile, tireDiameter, tireSeason, tireType, tireLoadIndex, tireSpeedIndex, tireRunflat.
Felge: rimSize, rimWidth, rimBoltPattern(PCD), rimET, rimLugHoles, rimMaterial, rimColor, rimQuantity.
Tekućine: fluidType, oilViscosity, oilSpecification, oilSynthetic, oilVolume, oilBrand.
Multimedija: mediaType, mediaConnectivity, mediaPower.
Ostalo: warranty, shipping.

## KLJUČNO za implementaciju
- Većina NOVIH polja = attr storage (jsonb) → NEMA schema migracije, NE razbija postojeće.
- column polja samo postojeća: priceEur/year/km/fuel/transmission/bodyType/drive/color/condition/engineCc/powerKw/doors/seats/county/sellerType/subcategory/make/model.
- Forma (objava + pretraga) renderira iz iste category-filters.ts scheme.
- publishRequired po subcategoryScope.
