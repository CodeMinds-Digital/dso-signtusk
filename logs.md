12:17:08.373 Running build in Washington, D.C., USA (East) – iad1
12:17:08.381 Build machine configuration: 2 cores, 8 GB
12:17:08.813 Cloning github.com/CodeMinds-Digital/dso-signtusk (Branch: working-deploy, Commit: 8f93896)
12:17:08.815 Previous build caches not available.
12:17:14.020 Cloning completed: 5.206s
12:17:14.298 Found .vercelignore
12:17:14.366 Removed 265 ignored files defined in .vercelignore
12:17:14.366 /.dockerignore
12:17:14.366 /.env copy.local
12:17:14.366 /.env.development
12:17:14.366 /.git/logs/HEAD
12:17:14.366 /.git/logs/refs/heads/master
12:17:14.367 /apps/remix/.dockerignore
12:17:14.367 /apps/remix/.env copy.local
12:17:14.367 /apps/remix/Dockerfile
12:17:14.367 /apps/remix/Dockerfile.bun
12:17:14.367 /apps/remix/Dockerfile.pnpm
12:17:14.694 Running "git diff --quiet HEAD^ HEAD ../../"
12:17:14.989 Running "vercel build"
12:17:15.410 Vercel CLI 50.1.3
12:17:15.576 > Detected Turbo. Adjusting default settings...
12:17:16.063 Running "install" command: `cd ../.. && npm ci`...
12:17:16.306 npm warn Unknown project config "link-workspace-packages". This will stop working in the next major version of npm.
12:17:25.042 npm warn deprecated scmp@2.1.0: Just use Node.js's crypto.timingSafeEqual()
12:17:25.519 npm warn deprecated serialize-error-cjs@0.1.4: Rolling release, please update to 0.2.0
12:17:26.284 npm warn deprecated querystring@0.2.0: The querystring API is considered Legacy. new code should use the URLSearchParams API instead.
12:17:26.287 npm warn deprecated phin@3.7.1: Package no longer supported. Contact Support at https://www.npmjs.com/support for more info.
12:17:27.423 npm warn deprecated lodash.get@4.4.2: This package is deprecated. Use the optional chaining (?.) operator instead.
12:17:27.633 npm warn deprecated request@2.88.2: request has been deprecated, see https://github.com/request/request/issues/3142
12:17:28.172 npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
12:17:28.609 npm warn deprecated har-validator@5.1.5: this library is no longer supported
12:17:31.741 npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead
12:17:34.170 npm warn deprecated @simplewebauthn/types@9.0.1: Package no longer supported. Contact Support at https://www.npmjs.com/support for more info.
12:17:37.435 npm warn deprecated @humanwhocodes/config-array@0.13.0: Use @eslint/config-array instead
12:17:37.663 npm warn deprecated @humanwhocodes/object-schema@2.0.3: Use @eslint/object-schema instead
12:17:38.587 npm warn deprecated oslo@0.17.0: Package is no longer supported. Please see https://oslojs.dev for the successor project.
12:17:40.846 npm warn deprecated @opentelemetry/exporter-jaeger@1.30.1: Package no longer supported. Contact Support at https://www.npmjs.com/support for more info.
12:17:42.405 npm warn deprecated rimraf@2.4.5: Rimraf versions prior to v4 are no longer supported
12:17:42.530 npm warn deprecated glob@6.0.4: Glob versions prior to v9 are no longer supported
12:17:42.879 npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
12:17:43.044 npm warn deprecated uuid@3.4.0: Please upgrade to version 7 or higher. Older versions may use Math.random() in certain circumstances, which is known to be problematic. See https://v8.dev/blog/math-random for details.
12:17:43.075 npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
12:17:43.114 npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
12:17:46.180 npm warn deprecated uuid@3.4.0: Please upgrade to version 7 or higher. Older versions may use Math.random() in certain circumstances, which is known to be problematic. See https://v8.dev/blog/math-random for details.
12:18:12.258 npm warn deprecated eslint@8.57.1: This version is no longer supported. Please see https://eslint.org/version-support for other options.
12:19:05.424
12:19:05.425 > @signtusk/root@2.2.6 postinstall
12:19:05.425 > if [ "$SKIP_PATCHES" != "true" ]; then patch-package; fi && if [ "$INSTALL_PLAYWRIGHT" = "true" ]; then npx playwright install; fi
12:19:05.425
12:19:05.441
12:19:05.442 > @signtusk/root@2.2.6 prepare
12:19:05.442 > if [ "$VERCEL" != "1" ]; then husky && husky install || true; fi
12:19:05.442
12:19:05.513
12:19:05.513 added 2832 packages, and audited 2878 packages in 2m
12:19:05.550
12:19:05.550 19 vulnerabilities (4 low, 6 moderate, 7 high, 2 critical)
12:19:05.550
12:19:05.551 To address all issues possible (including breaking changes), run:
12:19:05.551 npm audit fix --force
12:19:05.552
12:19:05.552 Some issues need review, and may require choosing
12:19:05.552 a different dependency.
12:19:05.552
12:19:05.552 Run `npm audit` for details.
12:19:05.841 npm warn Unknown project config "link-workspace-packages". This will stop working in the next major version of npm.
12:19:05.875
12:19:05.875 > @signtusk/remix@2.2.6 build
12:19:05.875 > ./.bin/build.sh
12:19:05.875
12:19:05.888 [Build]: Extracting and compiling translations
12:19:05.966 npm warn Unknown env config "link-workspace-packages". This will stop working in the next major version of npm.
12:19:05.967 npm warn Unknown project config "link-workspace-packages". This will stop working in the next major version of npm.
12:19:05.989
12:19:05.989 > @signtusk/root@2.2.6 translate
12:19:05.990 > npm run translate:extract && npm run translate:compile
12:19:05.990
12:19:06.132 npm warn Unknown env config "link-workspace-packages". This will stop working in the next major version of npm.
12:19:06.137 npm warn Unknown project config "link-workspace-packages". This will stop working in the next major version of npm.
12:19:06.200
12:19:06.200 > @signtusk/root@2.2.6 translate:extract
12:19:06.200 > lingui extract --clean
12:19:06.200
12:19:16.046 ✔ Done in 9s
12:19:16.047 Catalog statistics for packages/lib/translations/{locale}/web:
12:19:16.058 ┌─────────────┬─────────────┬─────────┐
12:19:16.059 │ Language │ Total count │ Missing │
12:19:16.059 ├─────────────┼─────────────┼─────────┤
12:19:16.059 │ [1men[22m (source) │ 2408 │ - │
12:19:16.059 │ de │ 2408 │ 121 │
12:19:16.059 │ es │ 2408 │ 121 │
12:19:16.059 │ fr │ 2408 │ 121 │
12:19:16.060 │ it │ 2408 │ 124 │
12:19:16.060 │ ja │ 2408 │ 121 │
12:19:16.060 │ ko │ 2408 │ 121 │
12:19:16.060 │ nl │ 2408 │ 121 │
12:19:16.060 │ pl │ 2408 │ 121 │
12:19:16.060 │ pt-BR │ 2408 │ 40 │
12:19:16.061 │ zh │ 2408 │ 121 │
12:19:16.061 └─────────────┴─────────────┴─────────┘
12:19:16.061
12:19:16.061 (Use "[33mnpm run translate:extract[39m" to update catalogs with new messages.)
12:19:16.061 (Use "[33mnpm run translate:compile[39m" to compile catalogs for production. Alternatively, use bundler plugins: https://lingui.dev/ref/cli#compiling-catalogs-in-ci)
12:19:16.192 npm warn Unknown env config "link-workspace-packages". This will stop working in the next major version of npm.
12:19:16.193 npm warn Unknown project config "link-workspace-packages". This will stop working in the next major version of npm.
12:19:16.215
12:19:16.216 > @signtusk/root@2.2.6 translate:compile
12:19:16.216 > lingui compile
12:19:16.216
12:19:16.538 Compiling message catalogs…
12:19:17.994 Done in 1s
12:19:18.025 [Build]: Building app
12:19:18.148 npm warn Unknown env config "link-workspace-packages". This will stop working in the next major version of npm.
12:19:18.148 npm warn Unknown project config "link-workspace-packages". This will stop working in the next major version of npm.
12:19:18.181
12:19:18.181 > @signtusk/remix@2.2.6 build:app
12:19:18.181 > npm run typecheck && cross-env NODE*ENV=production react-router build
12:19:18.181
12:19:18.308 npm warn Unknown env config "link-workspace-packages". This will stop working in the next major version of npm.
12:19:18.310 npm warn Unknown project config "link-workspace-packages". This will stop working in the next major version of npm.
12:19:18.340
12:19:18.341 > @signtusk/remix@2.2.6 typecheck
12:19:18.341 > react-router typegen && tsc
12:19:18.341
12:20:00.256 app/components/dialogs/admin-organisation-member-update-dialog.tsx(6,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberRole'.
12:20:00.257 app/components/dialogs/admin-organisation-member-update-dialog.tsx(73,58): error TS7006: Parameter 'ogm' implicitly has an 'any' type.
12:20:00.257 app/components/dialogs/admin-organisation-member-update-dialog.tsx(100,10): error TS2349: This expression is not callable.
12:20:00.258 Type 'NonExhaustiveError<"ADMIN" | "MANAGER" | "MEMBER">' has no call signatures.
12:20:00.258 app/components/dialogs/ai-features-enable-dialog.tsx(5,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberRole'.
12:20:00.258 app/components/dialogs/ai-features-enable-dialog.tsx(5,34): error TS2305: Module '"@prisma/client"' has no exported member 'TeamMemberRole'.
12:20:00.258 app/components/dialogs/ai-field-detection-dialog.tsx(94,29): error TS2345: Argument of type '{ [x: string]: any; type?: unknown; positionX?: unknown; positionY?: unknown; width?: unknown; height?: unknown; confidence?: unknown; pageNumber?: unknown; recipientId?: unknown; envelopeItemId?: unknown; }[]' is not assignable to parameter of type 'SetStateAction<NormalizedFieldWithContext[]>'.
12:20:00.258 Type '{ [x: string]: any; type?: unknown; positionX?: unknown; positionY?: unknown; width?: unknown; height?: unknown; confidence?: unknown; pageNumber?: unknown; recipientId?: unknown; envelopeItemId?: unknown; }[]' is not assignable to type 'NormalizedFieldWithContext[]'.
12:20:00.259 Type '{ [x: string]: any; type?: unknown; positionX?: unknown; positionY?: unknown; width?: unknown; height?: unknown; confidence?: unknown; pageNumber?: unknown; recipientId?: unknown; envelopeItemId?: unknown; }' is not assignable to type 'NormalizedFieldWithContext'.
12:20:00.259 Type '{ [x: string]: any; type?: unknown; positionX?: unknown; positionY?: unknown; width?: unknown; height?: unknown; confidence?: unknown; pageNumber?: unknown; recipientId?: unknown; envelopeItemId?: unknown; }' is not assignable to type 'Omit<NormalizedField, "recipientKey">'.
12:20:00.259 Property 'type' is optional in type '{ [x: string]: any; type?: unknown; positionX?: unknown; positionY?: unknown; width?: unknown; height?: unknown; confidence?: unknown; pageNumber?: unknown; recipientId?: unknown; envelopeItemId?: unknown; }' but required in type 'Omit<NormalizedField, "recipientKey">'.
12:20:00.259 app/components/dialogs/ai-recipient-detection-dialog.tsx(262,48): error TS2339: Property 'slice' does not exist on type '{}'.
12:20:00.259 app/components/dialogs/ai-recipient-detection-dialog.tsx(264,51): error TS2339: Property 'slice' does not exist on type '{}'.
12:20:00.260 app/components/dialogs/ai-recipient-detection-dialog.tsx(269,31): error TS2322: Type '{}' is not assignable to type 'ReactNode'.
12:20:00.260 app/components/dialogs/ai-recipient-detection-dialog.tsx(275,33): error TS2322: Type '{}' is not assignable to type 'ReactNode'.
12:20:00.261 app/components/dialogs/ai-recipient-detection-dialog.tsx(277,65): error TS2538: Type 'unknown' cannot be used as an index type.
12:20:00.261 app/components/dialogs/claim-update-dialog.tsx(22,50): error TS2537: Type 'unknown' has no matching index signature for type 'number'.
12:20:00.262 app/components/dialogs/document-delete-dialog.tsx(6,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.262 app/components/dialogs/document-duplicate-dialog.tsx(91,68): error TS2339: Property 'length' does not exist on type '{}'.
12:20:00.262 app/components/dialogs/document-duplicate-dialog.tsx(100,20): error TS7053: Element implicitly has an 'any' type because expression of type '0' can't be used to index type '{}'.
12:20:00.262 Property '0' does not exist on type '{}'.
12:20:00.262 app/components/dialogs/document-duplicate-dialog.tsx(101,29): error TS7053: Element implicitly has an 'any' type because expression of type '0' can't be used to index type '{}'.
12:20:00.262 Property '0' does not exist on type '{}'.
12:20:00.262 app/components/dialogs/document-resend-dialog.tsx(7,15): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.262 app/components/dialogs/document-resend-dialog.tsx(7,26): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.263 app/components/dialogs/document-resend-dialog.tsx(7,46): error TS2305: Module '"@prisma/client"' has no exported member 'Team'.
12:20:00.263 app/components/dialogs/document-resend-dialog.tsx(7,57): error TS2305: Module '"@prisma/client"' has no exported member 'User'.
12:20:00.263 app/components/dialogs/document-resend-dialog.tsx(99,30): error TS2322: Type 'unknown' is not assignable to type 'number'.
12:20:00.263 app/components/dialogs/envelope-distribute-dialog.tsx(7,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentDistributionMethod'.
12:20:00.263 app/components/dialogs/envelope-distribute-dialog.tsx(8,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.263 app/components/dialogs/envelope-distribute-dialog.tsx(9,3): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.263 app/components/dialogs/envelope-distribute-dialog.tsx(10,3): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.263 app/components/dialogs/envelope-distribute-dialog.tsx(11,3): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.263 app/components/dialogs/envelope-distribute-dialog.tsx(135,32): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.263 app/components/dialogs/envelope-distribute-dialog.tsx(135,43): error TS7006: Parameter 'index' implicitly has an 'any' type.
12:20:00.263 app/components/dialogs/envelope-distribute-dialog.tsx(145,10): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.263 app/components/dialogs/envelope-distribute-dialog.tsx(148,14): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.263 app/components/dialogs/envelope-distribute-dialog.tsx(158,40): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.263 app/components/dialogs/envelope-distribute-dialog.tsx(333,51): error TS2339: Property 'map' does not exist on type '{}'.
12:20:00.263 app/components/dialogs/envelope-distribute-dialog.tsx(333,56): error TS7006: Parameter 'email' implicitly has an 'any' type.
12:20:00.263 app/components/dialogs/envelope-distribute-dialog.tsx(482,62): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.263 app/components/dialogs/envelope-distribute-dialog.tsx(495,60): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.263 app/components/dialogs/envelope-download-dialog.tsx(5,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.264 app/components/dialogs/envelope-download-dialog.tsx(5,31): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeItem'.
12:20:00.264 app/components/dialogs/envelope-download-dialog.tsx(149,27): error TS2339: Property 'map' does not exist on type '{}'.
12:20:00.264 app/components/dialogs/envelope-download-dialog.tsx(149,32): error TS7006: Parameter 'item' implicitly has an 'any' type.
12:20:00.264 app/components/dialogs/envelope-duplicate-dialog.tsx(5,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.264 app/components/dialogs/envelope-redistribute-dialog.tsx(7,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.264 app/components/dialogs/envelope-redistribute-dialog.tsx(7,26): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.264 app/components/dialogs/envelope-redistribute-dialog.tsx(7,45): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.264 app/components/dialogs/envelope-redistribute-dialog.tsx(7,56): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.264 app/components/dialogs/folder-create-dialog.tsx(5,15): error TS2305: Module '"@prisma/client"' has no exported member 'FolderType'.
12:20:00.264 app/components/dialogs/organisation-email-domain-create-dialog.tsx(93,23): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'SetStateAction<DomainRecord[]>'.
12:20:00.264 app/components/dialogs/organisation-group-create-dialog.tsx(6,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberRole'.
12:20:00.264 app/components/dialogs/organisation-group-create-dialog.tsx(213,42): error TS2339: Property 'map' does not exist on type '{}'.
12:20:00.264 app/components/dialogs/organisation-group-create-dialog.tsx(213,47): error TS7006: Parameter 'member' implicitly has an 'any' type.
12:20:00.264 app/components/dialogs/organisation-leave-dialog.tsx(5,15): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberRole'.
12:20:00.264 app/components/dialogs/organisation-member-invite-dialog.tsx(7,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberRole'.
12:20:00.264 app/components/dialogs/organisation-member-invite-dialog.tsx(10,40): error TS7016: Could not find a declaration file for module 'papaparse'. '/vercel/path0/node_modules/papaparse/papaparse.js' implicitly has an 'any' type.
12:20:00.264 Try `npm i --save-dev @types/papaparse` if it exists or add a new declaration (.d.ts) file containing `declare module 'papaparse';`
12:20:00.264 app/components/dialogs/organisation-member-invite-dialog.tsx(68,21): error TS18046: 'invitation.email' is of type 'unknown'.
12:20:00.264 app/components/dialogs/organisation-member-invite-dialog.tsx(218,43): error TS7006: Parameter 'row' implicitly has an 'any' type.
12:20:00.265 app/components/dialogs/organisation-member-update-dialog.tsx(7,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberRole'.
12:20:00.265 app/components/dialogs/passkey-create-dialog.tsx(10,26): error TS7016: Could not find a declaration file for module 'ua-parser-js'. '/vercel/path0/node_modules/ua-parser-js/src/ua-parser.js' implicitly has an 'any' type.
12:20:00.265 Try `npm i --save-dev @types/ua-parser-js` if it exists or add a new declaration (.d.ts) file containing `declare module 'ua-parser-js';`
12:20:00.265 app/components/dialogs/public-profile-template-manage-dialog.tsx(7,15): error TS2305: Module '"@prisma/client"' has no exported member 'TemplateDirectLink'.
12:20:00.265 app/components/dialogs/public-profile-template-manage-dialog.tsx(7,35): error TS2305: Module '"@prisma/client"' has no exported member 'TemplateType'.
12:20:00.265 app/components/dialogs/team-delete-dialog.tsx(68,59): error TS7006: Parameter 'team' implicitly has an 'any' type.
12:20:00.265 app/components/dialogs/team-delete-dialog.tsx(209,49): error TS7006: Parameter 'team' implicitly has an 'any' type.
12:20:00.265 app/components/dialogs/team-email-delete-dialog.tsx(29,16): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'TeamGetPayload'.
12:20:00.265 app/components/dialogs/team-email-update-dialog.tsx(5,15): error TS2305: Module '"@prisma/client"' has no exported member 'TeamEmail'.
12:20:00.266 app/components/dialogs/team-group-create-dialog.tsx(5,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationGroupType'.
12:20:00.266 app/components/dialogs/team-group-create-dialog.tsx(5,33): error TS2305: Module '"@prisma/client"' has no exported member 'TeamMemberRole'.
12:20:00.266 app/components/dialogs/team-group-create-dialog.tsx(92,31): error TS2339: Property 'filter' does not exist on type '{}'.
12:20:00.266 app/components/dialogs/team-group-create-dialog.tsx(93,8): error TS7006: Parameter 'group' implicitly has an 'any' type.
12:20:00.266 app/components/dialogs/team-group-create-dialog.tsx(93,30): error TS2339: Property 'some' does not exist on type '{}'.
12:20:00.266 app/components/dialogs/team-group-create-dialog.tsx(93,36): error TS7006: Parameter 'teamGroup' implicitly has an 'any' type.
12:20:00.266 app/components/dialogs/team-group-create-dialog.tsx(182,71): error TS7006: Parameter 'group' implicitly has an 'any' type.
12:20:00.266 app/components/dialogs/team-group-create-dialog.tsx(247,36): error TS7031: Binding element 'id' implicitly has an 'any' type.
12:20:00.266 app/components/dialogs/team-group-delete-dialog.tsx(6,15): error TS2305: Module '"@prisma/client"' has no exported member 'TeamMemberRole'.
12:20:00.266 app/components/dialogs/team-group-update-dialog.tsx(7,10): error TS2305: Module '"@prisma/client"' has no exported member 'TeamMemberRole'.
12:20:00.266 app/components/dialogs/team-inherit-member-disable-dialog.tsx(2,15): error TS2305: Module '"@prisma/client"' has no exported member 'TeamGroup'.
12:20:00.266 app/components/dialogs/team-inherit-member-enable-dialog.tsx(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationGroupType'.
12:20:00.266 app/components/dialogs/team-inherit-member-enable-dialog.tsx(2,33): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberRole'.
12:20:00.266 app/components/dialogs/team-inherit-member-enable-dialog.tsx(2,57): error TS2305: Module '"@prisma/client"' has no exported member 'TeamMemberRole'.
12:20:00.266 app/components/dialogs/team-inherit-member-enable-dialog.tsx(53,10): error TS18046: 'organisationGroupQuery.data.data' is of type 'unknown'.
12:20:00.267 app/components/dialogs/team-inherit-member-enable-dialog.tsx(61,32): error TS7053: Element implicitly has an 'any' type because expression of type '0' can't be used to index type '{}'.
12:20:00.267 Property '0' does not exist on type '{}'.
12:20:00.267 app/components/dialogs/team-member-create-dialog.tsx(5,10): error TS2305: Module '"@prisma/client"' has no exported member 'TeamMemberRole'.
12:20:00.267 app/components/dialogs/team-member-create-dialog.tsx(94,32): error TS2339: Property 'filter' does not exist on type '{}'.
12:20:00.267 app/components/dialogs/team-member-create-dialog.tsx(95,8): error TS7006: Parameter 'member' implicitly has an 'any' type.
12:20:00.267 app/components/dialogs/team-member-create-dialog.tsx(95,32): error TS2339: Property 'some' does not exist on type '{}'.
12:20:00.267 app/components/dialogs/team-member-create-dialog.tsx(95,38): error TS7006: Parameter 'teamMember' implicitly has an 'any' type.
12:20:00.267 app/components/dialogs/team-member-create-dialog.tsx(204,72): error TS7006: Parameter 'member' implicitly has an 'any' type.
12:20:00.267 app/components/dialogs/team-member-create-dialog.tsx(269,31): error TS18046: 'organisationMemberQuery.data.data' is of type 'unknown'.
12:20:00.267 app/components/dialogs/team-member-create-dialog.tsx(270,36): error TS7031: Binding element 'id' implicitly has an 'any' type.
12:20:00.267 app/components/dialogs/team-member-update-dialog.tsx(7,10): error TS2305: Module '"@prisma/client"' has no exported member 'TeamMemberRole'.
12:20:00.267 app/components/dialogs/template-direct-link-dialog.tsx(6,15): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.267 app/components/dialogs/template-direct-link-dialog.tsx(6,26): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.267 app/components/dialogs/template-direct-link-dialog.tsx(6,46): error TS2305: Module '"@prisma/client"' has no exported member 'TemplateDirectLink'.
12:20:00.268 app/components/dialogs/template-use-dialog.tsx(7,15): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.268 app/components/dialogs/template-use-dialog.tsx(8,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentDistributionMethod'.
12:20:00.268 app/components/dialogs/template-use-dialog.tsx(8,38): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSigningOrder'.
12:20:00.268 app/components/dialogs/template-use-dialog.tsx(122,41): error TS2339: Property 'map' does not exist on type '{}'.
12:20:00.268 app/components/dialogs/template-use-dialog.tsx(122,46): error TS7006: Parameter 'item' implicitly has an 'any' type.
12:20:00.268 app/components/dialogs/template-use-dialog.tsx(233,23): error TS2339: Property 'length' does not exist on type '{}'.
12:20:00.268 app/components/dialogs/template-use-dialog.tsx(235,23): error TS2339: Property 'map' does not exist on type '{}'.
12:20:00.268 app/components/dialogs/template-use-dialog.tsx(235,28): error TS7006: Parameter 'item' implicitly has an 'any' type.
12:20:00.268 app/components/dialogs/token-delete-dialog.tsx(7,15): error TS2305: Module '"@prisma/client"' has no exported member 'ApiToken'.
12:20:00.268 app/components/dialogs/webhook-delete-dialog.tsx(7,15): error TS2305: Module '"@prisma/client"' has no exported member 'Webhook'.
12:20:00.268 app/components/dialogs/webhook-edit-dialog.tsx(6,15): error TS2305: Module '"@prisma/client"' has no exported member 'Webhook'.
12:20:00.268 app/components/dialogs/webhook-test-dialog.tsx(5,15): error TS2305: Module '"@prisma/client"' has no exported member 'Webhook'.
12:20:00.268 app/components/dialogs/webhook-test-dialog.tsx(6,10): error TS2305: Module '"@prisma/client"' has no exported member 'WebhookTriggerEvents'.
12:20:00.268 app/components/dialogs/webhook-test-dialog.tsx(127,53): error TS7006: Parameter 'event' implicitly has an 'any' type.
12:20:00.268 app/components/embed/authoring/configure-document-advanced-settings.tsx(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentDistributionMethod'.
12:20:00.269 app/components/embed/authoring/configure-document-recipients.tsx(8,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSigningOrder'.
12:20:00.269 app/components/embed/authoring/configure-document-recipients.tsx(8,32): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.269 app/components/embed/authoring/configure-document-view.tsx(3,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentDistributionMethod'.
12:20:00.269 app/components/embed/authoring/configure-document-view.tsx(3,38): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSigningOrder'.
12:20:00.269 app/components/embed/authoring/configure-document-view.tsx(3,60): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.269 app/components/embed/authoring/configure-document-view.types.ts(9,44): error TS2307: Cannot find module '@signtusk/prisma/generated/types' or its corresponding type declarations.
12:20:00.269 app/components/embed/authoring/configure-fields-view.tsx(6,15): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeItem'.
12:20:00.269 app/components/embed/authoring/configure-fields-view.tsx(6,29): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.269 app/components/embed/authoring/configure-fields-view.tsx(7,10): error TS2305: Module '"@prisma/client"' has no exported member 'ReadStatus'.
12:20:00.269 app/components/embed/authoring/configure-fields-view.tsx(7,27): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.269 app/components/embed/authoring/configure-fields-view.tsx(7,38): error TS2305: Module '"@prisma/client"' has no exported member 'SendStatus'.
12:20:00.269 app/components/embed/authoring/configure-fields-view.tsx(7,50): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.269 app/components/embed/authoring/configure-fields-view.tsx(180,38): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'number'.
12:20:00.269 app/components/embed/authoring/configure-fields-view.tsx(196,20): error TS18046: 'lastActiveField.pageX' is of type 'unknown'.
12:20:00.269 app/components/embed/authoring/configure-fields-view.tsx(197,20): error TS18046: 'lastActiveField.pageY' is of type 'unknown'.
12:20:00.269 app/components/embed/authoring/configure-fields-view.tsx(254,18): error TS18046: 'copiedField.pageX' is of type 'unknown'.
12:20:00.269 app/components/embed/authoring/configure-fields-view.tsx(255,18): error TS18046: 'copiedField.pageY' is of type 'unknown'.
12:20:00.269 app/components/embed/authoring/configure-fields-view.tsx(565,25): error TS2322: Type 'unknown' is not assignable to type 'Key | null | undefined'.
12:20:00.269 app/components/embed/authoring/configure-fields-view.tsx(584,65): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'SetStateAction<string | null>'.
12:20:00.269 app/components/embed/authoring/field-advanced-settings-drawer.tsx(39,75): error TS2538: Type 'unknown' cannot be used as an index type.
12:20:00.269 app/components/embed/authoring/field-advanced-settings-drawer.tsx(47,33): error TS2538: Type 'unknown' cannot be used as an index type.
12:20:00.269 app/components/embed/authoring/field-advanced-settings-drawer.tsx(49,11): error TS2322: Type '{ [x: string]: any; nativeId?: unknown; formId?: unknown; type?: unknown; signerEmail?: unknown; inserted?: unknown; recipientId?: unknown; pageNumber?: unknown; pageX?: unknown; pageY?: unknown; pageWidth?: unknown; pageHeight?: unknown; fieldMeta?: unknown; }' is not assignable to type 'FieldFormType'.
12:20:00.269 Types of property 'nativeId' are incompatible.
12:20:00.273 Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.273 app/components/embed/authoring/field-advanced-settings-drawer.tsx(50,11): error TS2322: Type '{ [x: string]: any; nativeId?: unknown; formId?: unknown; type?: unknown; signerEmail?: unknown; inserted?: unknown; recipientId?: unknown; pageNumber?: unknown; pageX?: unknown; pageY?: unknown; pageWidth?: unknown; pageHeight?: unknown; fieldMeta?: unknown; }[]' is not assignable to type 'FieldFormType[]'.
12:20:00.273 Type '{ [x: string]: any; nativeId?: unknown; formId?: unknown; type?: unknown; signerEmail?: unknown; inserted?: unknown; recipientId?: unknown; pageNumber?: unknown; pageX?: unknown; pageY?: unknown; pageWidth?: unknown; pageHeight?: unknown; fieldMeta?: unknown; }' is not assignable to type 'FieldFormType'.
12:20:00.273 Types of property 'nativeId' are incompatible.
12:20:00.273 Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.273 app/components/embed/authoring/field-advanced-settings-drawer.tsx(53,27): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string'.
12:20:00.273 app/components/embed/embed-direct-template-client-page.tsx(6,15): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentMeta'.
12:20:00.274 app/components/embed/embed-direct-template-client-page.tsx(6,29): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeItem'.
12:20:00.274 app/components/embed/embed-direct-template-client-page.tsx(6,43): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.274 app/components/embed/embed-direct-template-client-page.tsx(6,54): error TS2305: Module '"@prisma/client"' has no exported member 'Signature'.
12:20:00.274 app/components/embed/embed-direct-template-client-page.tsx(7,15): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.274 app/components/embed/embed-direct-template-client-page.tsx(7,22): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.274 app/components/embed/embed-document-completed.tsx(2,15): error TS2305: Module '"@prisma/client"' has no exported member 'Signature'.
12:20:00.274 app/components/embed/embed-document-fields.tsx(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentMeta'.
12:20:00.274 app/components/embed/embed-document-fields.tsx(2,15): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.274 app/components/embed/embed-document-fields.tsx(2,22): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.274 app/components/embed/embed-document-signing-page-v1.tsx(6,15): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentMeta'.
12:20:00.274 app/components/embed/embed-document-signing-page-v1.tsx(6,29): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeItem'.
12:20:00.274 app/components/embed/embed-document-signing-page-v1.tsx(7,15): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.275 app/components/embed/embed-document-signing-page-v1.tsx(7,22): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.275 app/components/embed/embed-document-signing-page-v1.tsx(7,33): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.275 app/components/embed/embed-document-signing-page-v1.tsx(7,48): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.275 app/components/embed/embed-document-signing-page-v2.tsx(169,16): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.275 app/components/embed/embed-document-signing-page-v2.tsx(170,21): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.275 app/components/embed/embed-document-signing-page-v2.tsx(171,48): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.275 app/components/embed/embed-document-signing-page-v2.tsx(172,22): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.275 app/components/embed/embed-document-signing-page-v2.tsx(175,20): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.275 app/components/embed/embed-document-signing-page-v2.tsx(175,33): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.275 app/components/embed/embed-document-signing-page-v2.tsx(175,47): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.275 app/components/embed/embed-document-signing-page-v2.tsx(181,16): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.275 app/components/embed/embed-document-signing-page-v2.tsx(182,21): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.275 app/components/embed/embed-document-signing-page-v2.tsx(183,48): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.275 app/components/embed/embed-document-signing-page-v2.tsx(184,22): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.276 app/components/embed/embed-document-signing-page-v2.tsx(187,19): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.276 app/components/embed/embed-document-signing-page-v2.tsx(187,32): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.276 app/components/embed/embed-document-signing-page-v2.tsx(187,46): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.276 app/components/embed/embed-document-signing-page-v2.tsx(202,30): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.276 app/components/embed/embed-document-signing-page-v2.tsx(204,60): error TS2339: Property 'signatureImageAsBase64' does not exist on type '{}'.
12:20:00.276 app/components/embed/embed-document-signing-page-v2.tsx(205,52): error TS2339: Property 'typedSignature' does not exist on type '{}'.
12:20:00.276 app/components/embed/multisign/multi-sign-document-list.tsx(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'ReadStatus'.
12:20:00.276 app/components/embed/multisign/multi-sign-document-list.tsx(2,22): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.276 app/components/embed/multisign/multi-sign-document-list.tsx(2,37): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.276 app/components/embed/multisign/multi-sign-document-signing-view.tsx(6,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.276 app/components/embed/multisign/multi-sign-document-signing-view.tsx(6,26): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.276 app/components/embed/multisign/multi-sign-document-signing-view.tsx(6,37): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.276 app/components/embed/multisign/multi-sign-document-signing-view.tsx(86,29): error TS18046: 'document.fields' is of type 'unknown'.
12:20:00.276 app/components/embed/multisign/multi-sign-document-signing-view.tsx(86,52): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.277 app/components/embed/multisign/multi-sign-document-signing-view.tsx(89,5): error TS18046: 'document.fields' is of type 'unknown'.
12:20:00.277 app/components/embed/multisign/multi-sign-document-signing-view.tsx(89,30): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.277 app/components/embed/multisign/multi-sign-document-signing-view.tsx(91,5): error TS18046: 'document.fields' is of type 'unknown'.
12:20:00.277 app/components/embed/multisign/multi-sign-document-signing-view.tsx(91,30): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.277 app/components/embed/multisign/multi-sign-document-signing-view.tsx(95,67): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.277 app/components/embed/multisign/multi-sign-document-signing-view.tsx(97,28): error TS18046: 'document.fields' is of type 'unknown'.
12:20:00.277 app/components/embed/multisign/multi-sign-document-signing-view.tsx(97,53): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.277 app/components/embed/multisign/multi-sign-document-signing-view.tsx(138,9): error TS2322: Type 'unknown' is not assignable to type 'number'.
12:20:00.277 app/components/embed/multisign/multi-sign-document-signing-view.tsx(146,9): error TS2322: Type 'unknown' is not assignable to type 'number'.
12:20:00.277 app/components/embed/multisign/multi-sign-document-signing-view.tsx(172,9): error TS2322: Type 'unknown' is not assignable to type 'number'.
12:20:00.277 app/components/embed/multisign/multi-sign-document-signing-view.tsx(204,58): error TS2322: Type 'unknown' is not assignable to type 'ReactNode'.
12:20:00.278 app/components/embed/multisign/multi-sign-document-signing-view.tsx(215,21): error TS2322: Type 'unknown' is not assignable to type 'number'.
12:20:00.278 app/components/embed/multisign/multi-sign-document-signing-view.tsx(229,35): error TS18046: 'document.envelopeItems' is of type 'unknown'.
12:20:00.278 app/components/embed/multisign/multi-sign-document-signing-view.tsx(325,62): error TS2339: Property 'typedSignatureEnabled' does not exist on type '{}'.
12:20:00.278 app/components/embed/multisign/multi-sign-document-signing-view.tsx(328,62): error TS2339: Property 'uploadSignatureEnabled' does not exist on type '{}'.
12:20:00.278 app/components/embed/multisign/multi-sign-document-signing-view.tsx(331,62): error TS2339: Property 'drawSignatureEnabled' does not exist on type '{}'.
12:20:00.278 app/components/embed/multisign/multi-sign-document-signing-view.tsx(383,19): error TS2322: Type 'unknown' is not assignable to type 'Pick<DocumentMeta, "typedSignatureEnabled" | "uploadSignatureEnabled" | "drawSignatureEnabled" | "timezone" | "dateFormat"> | null | undefined'.
12:20:00.278 app/components/embed/multisign/multi-sign-document-signing-view.tsx(392,19): error TS2322: Type '{} | undefined' is not assignable to type 'Pick<DocumentMeta, "dateFormat"> | undefined'.
12:20:00.278 Property 'dateFormat' is missing in type '{}' but required in type 'Pick<DocumentMeta, "dateFormat">'.
12:20:00.278 app/components/forms/2fa/disable-authenticator-app-dialog.tsx(7,27): error TS7016: Could not find a declaration file for module 'react-dom'. '/vercel/path0/node_modules/react-dom/index.js' implicitly has an 'any' type.
12:20:00.278 Try `npm i --save-dev @types/react-dom` if it exists or add a new declaration (.d.ts) file containing `declare module 'react-dom';`
12:20:00.278 app/components/forms/branding-preferences-form.tsx(5,15): error TS2305: Module '"@prisma/client"' has no exported member 'TeamGlobalSettings'.
12:20:00.278 app/components/forms/document-preferences-form.tsx(5,15): error TS2305: Module '"@prisma/client"' has no exported member 'TeamGlobalSettings'.
12:20:00.278 app/components/forms/document-preferences-form.tsx(6,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentVisibility'.
12:20:00.278 app/components/forms/document-preferences-form.tsx(6,30): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationType'.
12:20:00.279 app/components/forms/email-preferences-form.tsx(3,15): error TS2305: Module '"@prisma/client"' has no exported member 'TeamGlobalSettings'.
12:20:00.279 app/components/forms/email-preferences-form.tsx(107,33): error TS2339: Property 'map' does not exist on type '{}'.
12:20:00.279 app/components/forms/email-preferences-form.tsx(107,38): error TS7006: Parameter 'email' implicitly has an 'any' type.
12:20:00.279 app/components/forms/public-profile-form.tsx(7,15): error TS2305: Module '"@prisma/client"' has no exported member 'TeamProfile'.
12:20:00.279 app/components/forms/subscription-claim-form.tsx(3,15): error TS2305: Module '"@prisma/client"' has no exported member 'SubscriptionClaim'.
12:20:00.279 app/components/forms/token.tsx(7,15): error TS2305: Module '"@prisma/client"' has no exported member 'ApiToken'.
12:20:00.279 app/components/general/app-header.tsx(3,10): error TS2305: Module '"@prisma/client"' has no exported member 'ReadStatus'.
12:20:00.279 app/components/general/app-nav-mobile.tsx(5,10): error TS2305: Module '"@prisma/client"' has no exported member 'ReadStatus'.
12:20:00.279 app/components/general/avatar-with-recipient.tsx(3,15): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.279 app/components/general/avatar-with-recipient.tsx(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.279 app/components/general/direct-template/direct-template-configure-form.tsx(5,15): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.279 app/components/general/direct-template/direct-template-configure-form.tsx(6,15): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.279 app/components/general/direct-template/direct-template-configure-form.tsx(68,67): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.280 app/components/general/direct-template/direct-template-configure-form.tsx(82,38): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.280 app/components/general/direct-template/direct-template-configure-form.tsx(109,43): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.280 app/components/general/direct-template/direct-template-page.tsx(5,15): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.280 app/components/general/direct-template/direct-template-page.tsx(6,15): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.280 app/components/general/direct-template/direct-template-signing-form.tsx(4,15): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.280 app/components/general/direct-template/direct-template-signing-form.tsx(4,22): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.280 app/components/general/direct-template/direct-template-signing-form.tsx(4,33): error TS2305: Module '"@prisma/client"' has no exported member 'Signature'.
12:20:00.280 app/components/general/direct-template/direct-template-signing-form.tsx(5,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.280 app/components/general/direct-template/direct-template-signing-form.tsx(233,56): error TS7006: Parameter 'a' implicitly has an 'any' type.
12:20:00.280 app/components/general/direct-template/direct-template-signing-form.tsx(233,59): error TS7006: Parameter 'b' implicitly has an 'any' type.
12:20:00.280 app/components/general/direct-template/direct-template-signing-form.tsx(242,54): error TS7006: Parameter 'r' implicitly has an 'any' type.
12:20:00.280 app/components/general/document-signing/document-signing-auth-2fa.tsx(5,10): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.280 app/components/general/document-signing/document-signing-auth-account.tsx(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.280 app/components/general/document-signing/document-signing-auth-dialog.tsx(4,15): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.281 app/components/general/document-signing/document-signing-auth-passkey.tsx(7,10): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.281 app/components/general/document-signing/document-signing-auth-provider.tsx(3,15): error TS2305: Module '"@prisma/client"' has no exported member 'Envelope'.
12:20:00.281 app/components/general/document-signing/document-signing-auth-provider.tsx(3,25): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.281 app/components/general/document-signing/document-signing-auth-provider.tsx(3,41): error TS2305: Module '"@prisma/client"' has no exported member 'Passkey'.
12:20:00.281 app/components/general/document-signing/document-signing-auth-provider.tsx(3,55): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.281 app/components/general/document-signing/document-signing-auto-sign.tsx(6,15): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.281 app/components/general/document-signing/document-signing-auto-sign.tsx(6,22): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.281 app/components/general/document-signing/document-signing-auto-sign.tsx(7,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.281 app/components/general/document-signing/document-signing-complete-dialog.tsx(5,15): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.281 app/components/general/document-signing/document-signing-complete-dialog.tsx(5,22): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.281 app/components/general/document-signing/document-signing-complete-dialog.tsx(6,10): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.281 app/components/general/document-signing/document-signing-field-container.tsx(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.281 app/components/general/document-signing/document-signing-form.tsx(6,15): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.282 app/components/general/document-signing/document-signing-form.tsx(6,22): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.282 app/components/general/document-signing/document-signing-form.tsx(6,38): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.282 app/components/general/document-signing/document-signing-form.tsx(6,49): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.282 app/components/general/document-signing/document-signing-mobile-widget.tsx(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.282 app/components/general/document-signing/document-signing-mobile-widget.tsx(30,9): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.282 app/components/general/document-signing/document-signing-mobile-widget.tsx(43,18): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.282 app/components/general/document-signing/document-signing-mobile-widget.tsx(60,28): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.282 app/components/general/document-signing/document-signing-mobile-widget.tsx(70,29): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.282 app/components/general/document-signing/document-signing-mobile-widget.tsx(102,12): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.282 app/components/general/document-signing/document-signing-mobile-widget.tsx(103,13): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.282 app/components/general/document-signing/document-signing-page-view-v1.tsx(4,15): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.282 app/components/general/document-signing/document-signing-page-view-v1.tsx(5,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.282 app/components/general/document-signing/document-signing-page-view-v1.tsx(5,21): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.282 app/components/general/document-signing/document-signing-page-view-v2.tsx(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.283 app/components/general/document-signing/document-signing-page-view-v2.tsx(4,24): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.283 app/components/general/document-signing/document-signing-page-view-v2.tsx(66,9): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.283 app/components/general/document-signing/document-signing-page-view-v2.tsx(92,22): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.283 app/components/general/document-signing/document-signing-page-view-v2.tsx(134,29): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.283 app/components/general/document-signing/document-signing-page-view-v2.tsx(135,24): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.283 app/components/general/document-signing/document-signing-page-view-v2.tsx(145,29): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.283 app/components/general/document-signing/document-signing-page-view-v2.tsx(146,33): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.283 app/components/general/document-signing/document-signing-page-view-v2.tsx(147,32): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.283 app/components/general/document-signing/document-signing-page-view-v2.tsx(148,24): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.283 app/components/general/document-signing/document-signing-page-view-v2.tsx(157,16): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.283 app/components/general/document-signing/document-signing-page-view-v2.tsx(159,58): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.283 app/components/general/document-signing/document-signing-page-view-v2.tsx(160,26): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.284 app/components/general/document-signing/document-signing-page-view-v2.tsx(165,32): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.284 app/components/general/document-signing/document-signing-page-view-v2.tsx(166,64): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.284 app/components/general/document-signing/document-signing-page-view-v2.tsx(167,37): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.284 app/components/general/document-signing/document-signing-page-view-v2.tsx(168,38): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.284 app/components/general/document-signing/document-signing-recipient-provider.tsx(3,15): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.284 app/components/general/document-signing/envelope-signing-provider.tsx(4,3): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.284 app/components/general/document-signing/envelope-signing-provider.tsx(5,8): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.284 app/components/general/document-signing/envelope-signing-provider.tsx(6,3): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.284 app/components/general/document-signing/envelope-signing-provider.tsx(7,8): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.284 app/components/general/document-signing/envelope-signing-provider.tsx(8,3): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.284 app/components/general/document-signing/envelope-signing-provider.tsx(9,3): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.284 app/components/general/document-signing/envelope-signing-provider.tsx(46,57): error TS2339: Property 'recipients' does not exist on type 'unknown'.
12:20:00.284 app/components/general/document-signing/envelope-signing-provider.tsx(50,63): error TS2339: Property 'recipients' does not exist on type 'unknown'.
12:20:00.285 app/components/general/document-signing/envelope-signing-provider.tsx(53,70): error TS2339: Property 'recipients' does not exist on type 'unknown'.
12:20:00.285 app/components/general/document-signing/envelope-signing-provider.tsx(102,28): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.285 app/components/general/document-signing/envelope-signing-provider.tsx(110,11): error TS2698: Spread types may only be created from object types.
12:20:00.285 app/components/general/document-signing/envelope-signing-provider.tsx(111,23): error TS18046: 'prev.envelope' is of type 'unknown'.
12:20:00.285 app/components/general/document-signing/envelope-signing-provider.tsx(111,53): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.285 app/components/general/document-signing/envelope-signing-provider.tsx(112,30): error TS18046: 'data.signedField' is of type 'unknown'.
12:20:00.285 app/components/general/document-signing/envelope-signing-provider.tsx(115,49): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.285 app/components/general/document-signing/envelope-signing-provider.tsx(116,34): error TS18046: 'data.signedField' is of type 'unknown'.
12:20:00.285 app/components/general/document-signing/envelope-signing-provider.tsx(123,11): error TS2698: Spread types may only be created from object types.
12:20:00.285 app/components/general/document-signing/envelope-signing-provider.tsx(124,19): error TS18046: 'prev.recipient' is of type 'unknown'.
12:20:00.285 app/components/general/document-signing/envelope-signing-provider.tsx(124,46): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.285 app/components/general/document-signing/envelope-signing-provider.tsx(125,26): error TS18046: 'data.signedField' is of type 'unknown'.
12:20:00.285 app/components/general/document-signing/envelope-signing-provider.tsx(140,10): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.285 app/components/general/document-signing/envelope-signing-provider.tsx(141,11): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.286 app/components/general/document-signing/envelope-signing-provider.tsx(142,42): error TS2339: Property 'signatureImageAsBase64' does not exist on type '{}'.
12:20:00.286 app/components/general/document-signing/envelope-signing-provider.tsx(144,48): error TS2339: Property 'signatureImageAsBase64' does not exist on type '{}'.
12:20:00.286 app/components/general/document-signing/envelope-signing-provider.tsx(149,9): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.286 app/components/general/document-signing/envelope-signing-provider.tsx(150,42): error TS2339: Property 'typedSignature' does not exist on type '{}'.
12:20:00.286 app/components/general/document-signing/envelope-signing-provider.tsx(152,48): error TS2339: Property 'typedSignature' does not exist on type '{}'.
12:20:00.286 app/components/general/document-signing/envelope-signing-provider.tsx(157,10): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.286 app/components/general/document-signing/envelope-signing-provider.tsx(157,58): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.288 app/components/general/document-signing/envelope-signing-provider.tsx(162,24): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.289 app/components/general/document-signing/envelope-signing-provider.tsx(174,28): error TS18046: 'envelopeData.recipient' is of type 'unknown'.
12:20:00.289 app/components/general/document-signing/envelope-signing-provider.tsx(175,16): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.289 app/components/general/document-signing/envelope-signing-provider.tsx(176,13): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.289 app/components/general/document-signing/envelope-signing-provider.tsx(177,30): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.290 app/components/general/document-signing/envelope-signing-provider.tsx(178,12): error TS7006: Parameter 'item' implicitly has an 'any' type.
12:20:00.290 app/components/general/document-signing/envelope-signing-provider.tsx(197,7): error TS18046: 'envelopeData.recipient' is of type 'unknown'.
12:20:00.290 app/components/general/document-signing/envelope-signing-provider.tsx(203,12): error TS18046: 'envelopeData.recipient' is of type 'unknown'.
12:20:00.290 app/components/general/document-signing/envelope-signing-provider.tsx(203,50): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.290 app/components/general/document-signing/envelope-signing-provider.tsx(204,7): error TS18046: 'envelopeData.recipient' is of type 'unknown'.
12:20:00.290 app/components/general/document-signing/envelope-signing-provider.tsx(210,12): error TS18046: 'envelopeData.recipient' is of type 'unknown'.
12:20:00.290 app/components/general/document-signing/envelope-signing-provider.tsx(211,7): error TS18046: 'envelopeData.recipient' is of type 'unknown'.
12:20:00.290 app/components/general/document-signing/envelope-signing-provider.tsx(217,5): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.290 app/components/general/document-signing/envelope-signing-provider.tsx(218,9): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.291 app/components/general/document-signing/envelope-signing-provider.tsx(218,37): error TS7006: Parameter 'r' implicitly has an 'any' type.
12:20:00.291 app/components/general/document-signing/envelope-signing-provider.tsx(218,68): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.291 app/components/general/document-signing/envelope-signing-provider.tsx(228,5): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.291 app/components/general/document-signing/envelope-signing-provider.tsx(230,20): error TS7006: Parameter 'r' implicitly has an 'any' type.
12:20:00.291 app/components/general/document-signing/envelope-signing-provider.tsx(231,17): error TS7006: Parameter 'r' implicitly has an 'any' type.
12:20:00.291 app/components/general/document-signing/envelope-signing-provider.tsx(231,40): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.291 app/components/general/document-signing/envelope-signing-provider.tsx(243,12): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.291 app/components/general/document-signing/envelope-signing-provider.tsx(243,38): error TS7006: Parameter 'r' implicitly has an 'any' type.
12:20:00.291 app/components/general/document-signing/envelope-signing-provider.tsx(244,7): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.291 app/components/general/document-signing/envelope-signing-provider.tsx(247,36): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.291 app/components/general/document-signing/envelope-signing-provider.tsx(253,41): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.291 app/components/general/document-signing/envelope-signing-provider.tsx(254,16): error TS7031: Binding element 'signingStatus' implicitly has an 'any' type.
12:20:00.291 app/components/general/document-signing/envelope-signing-provider.tsx(255,15): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.291 app/components/general/document-signing/envelope-signing-provider.tsx(256,29): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.291 app/components/general/document-signing/envelope-signing-provider.tsx(266,14): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.292 app/components/general/document-signing/envelope-signing-provider.tsx(270,8): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.292 app/components/general/document-signing/envelope-signing-provider.tsx(271,7): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.292 app/components/general/document-signing/envelope-signing-provider.tsx(276,30): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.292 app/components/general/document-signing/envelope-signing-provider.tsx(276,56): error TS7006: Parameter 'a' implicitly has an 'any' type.
12:20:00.292 app/components/general/document-signing/envelope-signing-provider.tsx(276,59): error TS7006: Parameter 'b' implicitly has an 'any' type.
12:20:00.292 app/components/general/document-signing/envelope-signing-provider.tsx(285,54): error TS7006: Parameter 'r' implicitly has an 'any' type.
12:20:00.297 app/components/general/document-signing/envelope-signing-provider.tsx(285,69): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.298 app/components/general/document-signing/envelope-signing-provider.tsx(290,7): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.298 app/components/general/document-signing/envelope-signing-provider.tsx(290,44): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.298 app/components/general/document-signing/envelope-signing-provider.tsx(290,65): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.298 app/components/general/document-signing/envelope-signing-provider.tsx(305,14): error TS18046: 'envelopeData.recipient' is of type 'unknown'.
12:20:00.298 app/components/general/document-signing/envelope-signing-provider.tsx(318,24): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.298 app/components/general/document-signing/envelope-signing-provider.tsx(318,47): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.298 app/components/general/document-signing/envelope-signing-provider.tsx(327,21): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.298 app/components/general/document-signing/envelope-signing-provider.tsx(336,38): error TS2345: Argument of type '{}' is not assignable to parameter of type 'string'.
12:20:00.298 app/components/general/document-signing/envelope-signing-provider.tsx(342,26): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.298 app/components/general/document-signing/envelope-signing-provider.tsx(354,9): error TS2698: Spread types may only be created from object types.
12:20:00.298 app/components/general/document-signing/envelope-signing-provider.tsx(355,21): error TS18046: 'prev.envelope' is of type 'unknown'.
12:20:00.298 app/components/general/document-signing/envelope-signing-provider.tsx(355,51): error TS7006: Parameter 'r' implicitly has an 'any' type.
12:20:00.298 app/components/general/document-signing/envelope-signing-provider.tsx(356,20): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.298 app/components/general/document-signing/envelope-signing-provider.tsx(359,39): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.298 app/components/general/document-signing/envelope-signing-provider.tsx(365,9): error TS2698: Spread types may only be created from object types.
12:20:00.298 app/components/general/document-signing/envelope-signing-provider.tsx(366,17): error TS18046: 'prev.recipient' is of type 'unknown'.
12:20:00.298 app/components/general/document-signing/envelope-signing-provider.tsx(366,44): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.298 app/components/general/document-signing/envelope-signing-provider.tsx(390,9): error TS2322: Type '(array: IterableContainer) => ReorderedArray<IterableContainer>' is not assignable to type 'Field[]'.
12:20:00.298 app/components/general/document/document-certificate-download-button.tsx(4,15): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.298 app/components/general/document/document-certificate-qr-view.tsx(4,15): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentData'.
12:20:00.298 app/components/general/document/document-certificate-qr-view.tsx(4,29): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.298 app/components/general/document/document-certificate-qr-view.tsx(4,50): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeItem'.
12:20:00.298 app/components/general/document/document-certificate-qr-view.tsx(4,64): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.298 app/components/general/document/document-edit-form.tsx(5,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentDistributionMethod'.
12:20:00.298 app/components/general/document/document-edit-form.tsx(5,38): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.298 app/components/general/document/document-edit-form.tsx(64,7): error TS2769: No overload matches this call.
12:20:00.298 Overload 1 of 2, '(input: { documentId: number; } | typeof skipToken, opts: DefinedUseTRPCQueryOptions<{ [x: string]: any; id?: unknown; source?: unknown; status?: unknown; createdAt?: unknown; updatedAt?: unknown; userId?: unknown; completedAt?: unknown; deletedAt?: unknown; teamId?: unknown; title?: unknown; authOptions?: unknown; ... 13 more ...; fields?: unknown; }, { ...; }, TRPCClientErrorLike<...>, { ...; }>): DefinedUseTRPCQueryResult<...>', gave the following error.
12:20:00.298 Type 'unknown' is not assignable to type 'number'.
12:20:00.298 Overload 2 of 2, '(input: { documentId: number; } | typeof skipToken, opts?: UseTRPCQueryOptions<{ [x: string]: any; id?: unknown; source?: unknown; status?: unknown; createdAt?: unknown; updatedAt?: unknown; userId?: unknown; completedAt?: unknown; deletedAt?: unknown; teamId?: unknown; title?: unknown; authOptions?: unknown; ... 13 more ...; fields?: unknown; }, { ...; }, TRPCClientErrorLike<...>, { ...; }> | undefined): UseTRPCQueryResult<...>', gave the following error.
12:20:00.298 Type 'unknown' is not assignable to type 'number'.
12:20:00.298 app/components/general/document/document-edit-form.tsx(79,11): error TS2322: Type 'unknown' is not assignable to type 'number'.
12:20:00.298 app/components/general/document/document-edit-form.tsx(91,11): error TS2322: Type 'unknown' is not assignable to type 'number'.
12:20:00.298 app/components/general/document/document-edit-form.tsx(103,11): error TS2322: Type 'unknown' is not assignable to type 'number'.
12:20:00.298 app/components/general/document/document-edit-form.tsx(115,11): error TS2322: Type 'unknown' is not assignable to type 'number'.
12:20:00.299 app/components/general/document/document-edit-form.tsx(154,9): error TS18046: 'recipients' is of type 'unknown'.
12:20:00.299 app/components/general/document/document-edit-form.tsx(163,13): error TS2339: Property 'timezone' does not exist on type 'unknown'.
12:20:00.299 app/components/general/document/document-edit-form.tsx(163,23): error TS2339: Property 'dateFormat' does not exist on type 'unknown'.
12:20:00.299 app/components/general/document/document-edit-form.tsx(163,35): error TS2339: Property 'redirectUrl' does not exist on type 'unknown'.
12:20:00.299 app/components/general/document/document-edit-form.tsx(163,48): error TS2339: Property 'language' does not exist on type 'unknown'.
12:20:00.299 app/components/general/document/document-edit-form.tsx(163,58): error TS2339: Property 'signatureTypes' does not exist on type 'unknown'.
12:20:00.299 app/components/general/document/document-edit-form.tsx(170,7): error TS2322: Type 'unknown' is not assignable to type 'number'.
12:20:00.299 app/components/general/document/document-edit-form.tsx(222,9): error TS2322: Type 'unknown' is not assignable to type 'number'.
12:20:00.299 app/components/general/document/document-edit-form.tsx(230,9): error TS2322: Type 'unknown' is not assignable to type 'number'.
12:20:00.299 app/components/general/document/document-edit-form.tsx(231,21): error TS18046: 'data.signers' is of type 'unknown'.
12:20:00.299 app/components/general/document/document-edit-form.tsx(231,39): error TS7006: Parameter 'signer' implicitly has an 'any' type.
12:20:00.299 app/components/general/document/document-edit-form.tsx(246,11): error TS2322: Type 'unknown' is not assignable to type 'number'.
12:20:00.299 app/components/general/document/document-edit-form.tsx(254,11): error TS2322: Type 'unknown' is not assignable to type 'number'.
12:20:00.299 app/components/general/document/document-edit-form.tsx(255,23): error TS18046: 'data.signers' is of type 'unknown'.
12:20:00.299 app/components/general/document/document-edit-form.tsx(255,41): error TS7006: Parameter 'signer' implicitly has an 'any' type.
12:20:00.299 app/components/general/document/document-edit-form.tsx(296,7): error TS2322: Type 'unknown' is not assignable to type 'number'.
12:20:00.299 app/components/general/document/document-edit-form.tsx(300,25): error TS18046: 'document.documentData' is of type 'unknown'.
12:20:00.299 app/components/general/document/document-edit-form.tsx(349,7): error TS2322: Type 'unknown' is not assignable to type 'number'.
12:20:00.299 app/components/general/document/document-edit-form.tsx(366,7): error TS2322: Type 'unknown' is not assignable to type 'number'.
12:20:00.299 app/components/general/document/document-edit-form.tsx(444,18): error TS18046: 'document.envelopeItems' is of type 'unknown'.
12:20:00.299 app/components/general/document/document-edit-form.tsx(445,27): error TS18046: 'document.envelopeItems' is of type 'unknown'.
12:20:00.299 app/components/general/document/document-edit-form.tsx(463,20): error TS18046: 'recipients' is of type 'unknown'.
12:20:00.299 app/components/general/document/document-edit-form.tsx(467,15): error TS2322: Type 'unknown' is not assignable to type 'Recipient[]'.
12:20:00.299 app/components/general/document/document-edit-form.tsx(468,15): error TS2322: Type 'unknown' is not assignable to type 'Field[]'.
12:20:00.299 app/components/general/document/document-edit-form.tsx(475,15): error TS2322: Type 'unknown' is not assignable to type 'Key | null | undefined'.
12:20:00.299 app/components/general/document/document-edit-form.tsx(477,15): error TS2322: Type 'unknown' is not assignable to type 'Recipient[]'.
12:20:00.299 app/components/general/document/document-edit-form.tsx(478,52): error TS2339: Property 'signingOrder' does not exist on type '{}'.
12:20:00.299 app/components/general/document/document-edit-form.tsx(479,62): error TS2339: Property 'allowDictateNextSigner' does not exist on type '{}'.
12:20:00.299 app/components/general/document/document-edit-form.tsx(480,15): error TS2322: Type 'unknown' is not assignable to type 'Field[]'.
12:20:00.299 app/components/general/document/document-edit-form.tsx(482,15): error TS2322: Type '(data: TAddSignersFormSchema) => Promise<{ [x: string]: any; recipients?: unknown; }>' is not assignable to type '(\_data: { [x: string]: any; signers?: unknown; signingOrder?: unknown; allowDictateNextSigner?: unknown; }) => Promise<AutoSaveResponse>'.
12:20:00.299 Type 'Promise<{ [x: string]: any; recipients?: unknown; }>' is not assignable to type 'Promise<AutoSaveResponse>'.
12:20:00.299 Type '{ [x: string]: any; recipients?: unknown; }' is not assignable to type 'AutoSaveResponse'.
12:20:00.299 Types of property 'recipients' are incompatible.
12:20:00.300 Type 'unknown' is not assignable to type 'Recipient[]'.
12:20:00.300 app/components/general/document/document-edit-form.tsx(487,15): error TS2322: Type 'unknown' is not assignable to type 'Key | null | undefined'.
12:20:00.300 app/components/general/document/document-edit-form.tsx(489,15): error TS2322: Type 'unknown' is not assignable to type 'Recipient[]'.
12:20:00.300 app/components/general/document/document-edit-form.tsx(490,15): error TS2322: Type 'unknown' is not assignable to type 'Field[]'.
12:20:00.300 app/components/general/document/document-edit-form.tsx(498,20): error TS18046: 'recipients' is of type 'unknown'.
12:20:00.300 app/components/general/document/document-edit-form.tsx(501,15): error TS2322: Type 'unknown' is not assignable to type 'Recipient[]'.
12:20:00.300 app/components/general/document/document-edit-form.tsx(502,15): error TS2322: Type 'unknown' is not assignable to type 'Field[]'.
12:20:00.300 app/components/general/document/document-page-view-button.tsx(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.300 app/components/general/document/document-page-view-button.tsx(2,26): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.300 app/components/general/document/document-page-view-button.tsx(2,41): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.300 app/components/general/document/document-page-view-button.tsx(22,47): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.300 app/components/general/document/document-page-view-dropdown.tsx(5,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.300 app/components/general/document/document-page-view-dropdown.tsx(55,47): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.300 app/components/general/document/document-page-view-dropdown.tsx(67,59): error TS7006: Parameter 'item' implicitly has an 'any' type.
12:20:00.300 app/components/general/document/document-page-view-recipients.tsx(6,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.300 app/components/general/document/document-page-view-recipients.tsx(6,26): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.300 app/components/general/document/document-page-view-recipients.tsx(6,41): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.300 app/components/general/document/document-page-view-recipients.tsx(97,26): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.300 app/components/general/document/document-page-view-recipients.tsx(97,37): error TS7006: Parameter 'i' implicitly has an 'any' type.
12:20:00.300 app/components/general/document/document-page-view-recipients.tsx(152,24): error TS2349: This expression is not callable.
12:20:00.300 Type 'NonExhaustiveError<any>' has no call signatures.
12:20:00.300 app/components/general/document/document-recipient-link-copy-dialog.tsx(6,15): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.300 app/components/general/document/document-recipient-link-copy-dialog.tsx(7,10): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.300 app/components/general/document/document-upload-button-legacy.tsx(6,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.300 app/components/general/envelope-editor/envelope-editor-fields-drag-drop.tsx(5,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.300 app/components/general/envelope-editor/envelope-editor-fields-drag-drop.tsx(109,8): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.300 app/components/general/envelope-editor/envelope-editor-fields-page-renderer.tsx(4,15): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.300 app/components/general/envelope-editor/envelope-editor-fields-page-renderer.tsx(123,49): error TS7006: Parameter 'r' implicitly has an 'any' type.
12:20:00.300 app/components/general/envelope-editor/envelope-editor-fields-page-renderer.tsx(131,9): error TS2322: Type 'unknown' is not assignable to type 'string'.
12:20:00.300 app/components/general/envelope-editor/envelope-editor-fields-page-renderer.tsx(135,9): error TS2322: Type 'unknown' is not assignable to type '{ type: "initials"; label?: string | undefined; placeholder?: string | undefined; required?: boolean | undefined; readOnly?: boolean | undefined; fontSize?: number | undefined; textAlign?: "left" | ... 2 more ... | undefined; } | ... 10 more ... | undefined'.
12:20:00.300 app/components/general/envelope-editor/envelope-editor-fields-page-renderer.tsx(140,35): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'number'.
12:20:00.300 app/components/general/envelope-editor/envelope-editor-fields-page-renderer.tsx(480,42): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string'.
12:20:00.300 app/components/general/envelope-editor/envelope-editor-fields-page-renderer.tsx(674,36): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string'.
12:20:00.300 app/components/general/envelope-editor/envelope-editor-fields-page-renderer.tsx(678,8): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.300 app/components/general/envelope-editor/envelope-editor-fields-page.tsx(7,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.300 app/components/general/envelope-editor/envelope-editor-fields-page.tsx(7,26): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.300 app/components/general/envelope-editor/envelope-editor-fields-page.tsx(7,37): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.300 app/components/general/envelope-editor/envelope-editor-fields-page.tsx(103,40): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string'.
12:20:00.301 app/components/general/envelope-editor/envelope-editor-fields-page.tsx(134,8): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.301 app/components/general/envelope-editor/envelope-editor-fields-page.tsx(161,39): error TS2322: Type '{ [x: string]: any; id?: unknown; formId?: unknown; envelopeItemId?: unknown; type?: unknown; recipientId?: unknown; page?: unknown; positionX?: unknown; positionY?: unknown; width?: unknown; height?: unknown; fieldMeta?: unknown; }[]' is not assignable to type '{ envelopeItemId: string; }[]'.
12:20:00.301 Type '{ [x: string]: any; id?: unknown; formId?: unknown; envelopeItemId?: unknown; type?: unknown; recipientId?: unknown; page?: unknown; positionX?: unknown; positionY?: unknown; width?: unknown; height?: unknown; fieldMeta?: unknown; }' is not assignable to type '{ envelopeItemId: string; }'.
12:20:00.301 Types of property 'envelopeItemId' are incompatible.
12:20:00.301 Type 'unknown' is not assignable to type 'string'.
12:20:00.301 app/components/general/envelope-editor/envelope-editor-fields-page.tsx(285,36): error TS2322: Type 'unknown' is not assignable to type 'Key | null | undefined'.
12:20:00.301 app/components/general/envelope-editor/envelope-editor-fields-page.tsx(300,28): error TS18046: 'selectedField.positionX' is of type 'unknown'.
12:20:00.301 app/components/general/envelope-editor/envelope-editor-fields-page.tsx(304,28): error TS18046: 'selectedField.positionY' is of type 'unknown'.
12:20:00.301 app/components/general/envelope-editor/envelope-editor-fields-page.tsx(308,28): error TS18046: 'selectedField.width' is of type 'unknown'.
12:20:00.301 app/components/general/envelope-editor/envelope-editor-fields-page.tsx(312,28): error TS18046: 'selectedField.height' is of type 'unknown'.
12:20:00.301 app/components/general/envelope-editor/envelope-editor-fields-page.tsx(323,54): error TS2538: Type 'unknown' cannot be used as an index type.
12:20:00.302 app/components/general/envelope-editor/envelope-editor-header.tsx(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.302 app/components/general/envelope-editor/envelope-editor-header.tsx(2,26): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.302 app/components/general/envelope-editor/envelope-editor-preview-page.tsx(5,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.302 app/components/general/envelope-editor/envelope-editor-preview-page.tsx(5,21): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.302 app/components/general/envelope-editor/envelope-editor-preview-page.tsx(44,51): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.303 app/components/general/envelope-editor/envelope-editor-preview-page.tsx(126,56): error TS7006: Parameter 'value' implicitly has an 'any' type.
12:20:00.303 app/components/general/envelope-editor/envelope-editor-preview-page.tsx(144,29): error TS7006: Parameter 'value' implicitly has an 'any' type.
12:20:00.303 app/components/general/envelope-editor/envelope-editor-preview-page.tsx(144,36): error TS7006: Parameter 'index' implicitly has an 'any' type.
12:20:00.303 app/components/general/envelope-editor/envelope-editor-preview-page.tsx(188,12): error TS2349: This expression is not callable.
12:20:00.303 Type 'NonExhaustiveError<{ [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknow...' has no call signatures.
12:20:00.303 app/components/general/envelope-editor/envelope-editor-preview-page.tsx(206,44): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.303 app/components/general/envelope-editor/envelope-editor-preview-page.tsx(217,41): error TS2322: Type '{ [x: string]: any; id?: unknown; formId?: unknown; envelopeItemId?: unknown; type?: unknown; recipientId?: unknown; page?: unknown; positionX?: unknown; positionY?: unknown; width?: unknown; height?: unknown; fieldMeta?: unknown; }[]' is not assignable to type '{ envelopeItemId: string; }[]'.
12:20:00.303 Type '{ [x: string]: any; id?: unknown; formId?: unknown; envelopeItemId?: unknown; type?: unknown; recipientId?: unknown; page?: unknown; positionX?: unknown; positionY?: unknown; width?: unknown; height?: unknown; fieldMeta?: unknown; }' is not assignable to type '{ envelopeItemId: string; }'.
12:20:00.303 Types of property 'envelopeItemId' are incompatible.
12:20:00.303 Type 'unknown' is not assignable to type 'string'.
12:20:00.303 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(13,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSigningOrder'.
12:20:00.303 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(13,32): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.303 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(13,46): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.303 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(13,61): error TS2305: Module '"@prisma/client"' has no exported member 'SendStatus'.
12:20:00.303 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(182,31): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.303 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(182,42): error TS7006: Parameter 'index' implicitly has an 'any' type.
12:20:00.304 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(202,54): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.304 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(212,14): error TS7006: Parameter 'signer' implicitly has an 'any' type.
12:20:00.304 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(235,33): error TS7006: Parameter 'signer' implicitly has an 'any' type.
12:20:00.304 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(240,14): error TS7006: Parameter 'a' implicitly has an 'any' type.
12:20:00.304 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(240,17): error TS7006: Parameter 'b' implicitly has an 'any' type.
12:20:00.304 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(241,13): error TS7006: Parameter 'signer' implicitly has an 'any' type.
12:20:00.304 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(241,21): error TS7006: Parameter 'index' implicitly has an 'any' type.
12:20:00.304 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(255,6): error TS7006: Parameter 'signer' implicitly has an 'any' type.
12:20:00.304 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(258,31): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.304 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(262,6): error TS7006: Parameter 'signer' implicitly has an 'any' type.
12:20:00.304 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(266,6): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.304 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(278,40): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.304 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(303,43): error TS7006: Parameter 's' implicitly has an 'any' type.
12:20:00.304 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(329,10): error TS7006: Parameter 's' implicitly has an 'any' type.
12:20:00.304 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(329,42): error TS18046: 'recipient.email' is of type 'unknown'.
12:20:00.304 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(333,10): error TS7006: Parameter 's' implicitly has an 'any' type.
12:20:00.304 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(333,41): error TS18046: 'recipient.name' is of type 'unknown'.
12:20:00.304 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(382,65): error TS7006: Parameter 's' implicitly has an 'any' type.
12:20:00.304 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(386,64): error TS7006: Parameter 's' implicitly has an 'any' type.
12:20:00.304 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(450,68): error TS2571: Object is of type 'unknown'.
12:20:00.304 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(457,9): error TS2698: Spread types may only be created from object types.
12:20:00.304 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(458,47): error TS18046: 'signer' is of type 'unknown'.
12:20:00.304 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(458,60): error TS18046: 'signer' is of type 'unknown'.
12:20:00.304 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(498,50): error TS7006: Parameter 'signer' implicitly has an 'any' type.
12:20:00.304 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(498,58): error TS7006: Parameter 'idx' implicitly has an 'any' type.
12:20:00.304 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(535,55): error TS7006: Parameter '*' implicitly has an 'any' type.
12:20:00.304 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(535,58): error TS7006: Parameter 'idx' implicitly has an 'any' type.
12:20:00.304 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(539,52): error TS7006: Parameter 's' implicitly has an 'any' type.
12:20:00.304 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(539,55): error TS7006: Parameter 'idx' implicitly has an 'any' type.
12:20:00.305 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(563,48): error TS7006: Parameter 'signer' implicitly has an 'any' type.
12:20:00.305 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(602,32): error TS18046: 'data.signers' is of type 'unknown'.
12:20:00.305 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(602,50): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.305 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(618,32): error TS7006: Parameter 'signer' implicitly has an 'any' type.
12:20:00.305 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(619,44): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.305 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(894,47): error TS7053: Element implicitly has an 'any' type because expression of type 'number' can't be used to index type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.305 No index signature with a parameter of type 'number' was found on type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.305 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(895,48): error TS7053: Element implicitly has an 'any' type because expression of type 'number' can't be used to index type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.305 No index signature with a parameter of type 'number' was found on type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.305 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(938,43): error TS7053: Element implicitly has an 'any' type because expression of type 'number' can't be used to index type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.305 No index signature with a parameter of type 'number' was found on type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.305 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(939,44): error TS7053: Element implicitly has an 'any' type because expression of type 'number' can't be used to index type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.305 No index signature with a parameter of type 'number' was found on type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.305 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(984,43): error TS7053: Element implicitly has an 'any' type because expression of type 'number' can't be used to index type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.305 No index signature with a parameter of type 'number' was found on type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.305 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(985,44): error TS7053: Element implicitly has an 'any' type because expression of type 'number' can't be used to index type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.305 No index signature with a parameter of type 'number' was found on type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.305 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(1029,43): error TS7053: Element implicitly has an 'any' type because expression of type 'number' can't be used to index type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.305 No index signature with a parameter of type 'number' was found on type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.305 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(1030,44): error TS7053: Element implicitly has an 'any' type because expression of type 'number' can't be used to index type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.305 No index signature with a parameter of type 'number' was found on type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.305 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(1058,45): error TS7053: Element implicitly has an 'any' type because expression of type 'number' can't be used to index type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.305 No index signature with a parameter of type 'number' was found on type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.305 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(1082,45): error TS7053: Element implicitly has an 'any' type because expression of type 'number' can't be used to index type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.305 No index signature with a parameter of type 'number' was found on type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.305 app/components/general/envelope-editor/envelope-editor-recipient-form.tsx(1083,46): error TS7053: Element implicitly has an 'any' type because expression of type 'number' can't be used to index type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.305 No index signature with a parameter of type 'number' was found on type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.305 app/components/general/envelope-editor/envelope-editor-settings-dialog.tsx(7,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentDistributionMethod'.
12:20:00.305 app/components/general/envelope-editor/envelope-editor-settings-dialog.tsx(8,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentVisibility'.
12:20:00.305 app/components/general/envelope-editor/envelope-editor-settings-dialog.tsx(9,3): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.306 app/components/general/envelope-editor/envelope-editor-settings-dialog.tsx(10,3): error TS2305: Module '"@prisma/client"' has no exported member 'SendStatus'.
12:20:00.306 app/components/general/envelope-editor/envelope-editor-settings-dialog.tsx(221,31): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.306 app/components/general/envelope-editor/envelope-editor-settings-dialog.tsx(237,7): error TS2339: Property 'timezone' does not exist on type 'unknown'.
12:20:00.306 app/components/general/envelope-editor/envelope-editor-settings-dialog.tsx(238,7): error TS2339: Property 'dateFormat' does not exist on type 'unknown'.
12:20:00.306 app/components/general/envelope-editor/envelope-editor-settings-dialog.tsx(239,7): error TS2339: Property 'redirectUrl' does not exist on type 'unknown'.
12:20:00.306 app/components/general/envelope-editor/envelope-editor-settings-dialog.tsx(240,7): error TS2339: Property 'language' does not exist on type 'unknown'.
12:20:00.306 app/components/general/envelope-editor/envelope-editor-settings-dialog.tsx(241,7): error TS2339: Property 'signatureTypes' does not exist on type 'unknown'.
12:20:00.306 app/components/general/envelope-editor/envelope-editor-settings-dialog.tsx(242,7): error TS2339: Property 'distributionMethod' does not exist on type 'unknown'.
12:20:00.306 app/components/general/envelope-editor/envelope-editor-settings-dialog.tsx(243,7): error TS2339: Property 'emailId' does not exist on type 'unknown'.
12:20:00.306 app/components/general/envelope-editor/envelope-editor-settings-dialog.tsx(244,7): error TS2339: Property 'emailSettings' does not exist on type 'unknown'.
12:20:00.306 app/components/general/envelope-editor/envelope-editor-settings-dialog.tsx(245,7): error TS2339: Property 'message' does not exist on type 'unknown'.
12:20:00.306 app/components/general/envelope-editor/envelope-editor-settings-dialog.tsx(246,7): error TS2339: Property 'subject' does not exist on type 'unknown'.
12:20:00.306 app/components/general/envelope-editor/envelope-editor-settings-dialog.tsx(247,7): error TS2339: Property 'emailReplyTo' does not exist on type 'unknown'.
12:20:00.306 app/components/general/envelope-editor/envelope-editor-settings-dialog.tsx(301,43): error TS2339: Property 'timezone' does not exist on type 'boolean'.
12:20:00.306 app/components/general/envelope-editor/envelope-editor-settings-dialog.tsx(311,40): error TS2339: Property 'timezone' does not exist on type 'boolean'.
12:20:00.306 app/components/general/envelope-editor/envelope-editor-settings-dialog.tsx(667,45): error TS2339: Property 'map' does not exist on type '{}'.
12:20:00.306 app/components/general/envelope-editor/envelope-editor-settings-dialog.tsx(667,50): error TS7006: Parameter 'email' implicitly has an 'any' type.
12:20:00.306 app/components/general/envelope-editor/envelope-editor-upload-page.tsx(7,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.306 app/components/general/envelope-editor/envelope-editor-upload-page.tsx(58,14): error TS7006: Parameter 'a' implicitly has an 'any' type.
12:20:00.306 app/components/general/envelope-editor/envelope-editor-upload-page.tsx(58,17): error TS7006: Parameter 'b' implicitly has an 'any' type.
12:20:00.306 app/components/general/envelope-editor/envelope-editor-upload-page.tsx(59,13): error TS7006: Parameter 'item' implicitly has an 'any' type.
12:20:00.306 app/components/general/envelope-editor/envelope-editor-upload-page.tsx(71,34): error TS18046: 'data' is of type 'unknown'.
12:20:00.306 app/components/general/envelope-editor/envelope-editor-upload-page.tsx(72,12): error TS7006: Parameter 'item' implicitly has an 'any' type.
12:20:00.306 app/components/general/envelope-editor/envelope-editor-upload-page.tsx(72,51): error TS7006: Parameter 'envelopeItem' implicitly has an 'any' type.
12:20:00.306 app/components/general/envelope-editor/envelope-editor-upload-page.tsx(84,52): error TS7006: Parameter 'originalItem' implicitly has an 'any' type.
12:20:00.306 app/components/general/envelope-editor/envelope-editor-upload-page.tsx(85,31): error TS18046: 'data' is of type 'unknown'.
12:20:00.306 app/components/general/envelope-editor/envelope-editor-upload-page.tsx(85,42): error TS7006: Parameter 'item' implicitly has an 'any' type.
12:20:00.306 app/components/general/envelope-editor/envelope-editor-upload-page.tsx(151,9): error TS18046: 'data' is of type 'unknown'.
12:20:00.306 app/components/general/envelope-editor/envelope-editor-upload-page.tsx(151,19): error TS7006: Parameter 'item' implicitly has an 'any' type.
12:20:00.306 app/components/general/envelope-editor/envelope-editor-upload-page.tsx(169,8): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.306 app/components/general/envelope-editor/envelope-editor-upload-page.tsx(173,53): error TS7006: Parameter 'item' implicitly has an 'any' type.
12:20:00.307 app/components/general/envelope-editor/envelope-editor-upload-page.tsx(174,39): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.307 app/components/general/envelope-editor/envelope-generic-page-renderer.tsx(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.307 app/components/general/envelope-editor/envelope-generic-page-renderer.tsx(4,31): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.307 app/components/general/envelope-editor/envelope-generic-page-renderer.tsx(4,42): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.307 app/components/general/envelope-editor/envelope-recipient-selector.tsx(7,15): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.307 app/components/general/envelope-editor/envelope-recipient-selector.tsx(7,22): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.307 app/components/general/envelope-editor/envelope-recipient-selector.tsx(8,10): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.307 app/components/general/envelope-editor/envelope-recipient-selector.tsx(8,25): error TS2305: Module '"@prisma/client"' has no exported member 'SendStatus'.
12:20:00.307 app/components/general/envelope-signing/envelope-signer-form.tsx(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.307 app/components/general/envelope-signing/envelope-signer-form.tsx(4,21): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.307 app/components/general/envelope-signing/envelope-signer-form.tsx(38,7): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.307 app/components/general/envelope-signing/envelope-signer-form.tsx(42,7): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.307 app/components/general/envelope-signing/envelope-signer-form.tsx(53,22): error TS7006: Parameter 'r' implicitly has an 'any' type.
12:20:00.307 app/components/general/envelope-signing/envelope-signer-form.tsx(54,19): error TS7006: Parameter 'r' implicitly has an 'any' type.
12:20:00.307 app/components/general/envelope-signing/envelope-signer-form.tsx(71,35): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.307 app/components/general/envelope-signing/envelope-signer-form.tsx(124,38): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.307 app/components/general/envelope-signing/envelope-signer-form.tsx(125,39): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.307 app/components/general/envelope-signing/envelope-signer-form.tsx(126,37): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.307 app/components/general/envelope-signing/envelope-signer-header.tsx(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.307 app/components/general/envelope-signing/envelope-signer-header.tsx(2,24): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.307 app/components/general/envelope-signing/envelope-signer-header.tsx(36,12): error TS18046: 'envelopeData.settings' is of type 'unknown'.
12:20:00.307 app/components/general/envelope-signing/envelope-signer-header.tsx(36,53): error TS18046: 'envelopeData.settings' is of type 'unknown'.
12:20:00.307 app/components/general/envelope-signing/envelope-signer-header.tsx(38,47): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.307 app/components/general/envelope-signing/envelope-signer-header.tsx(39,23): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.307 app/components/general/envelope-signing/envelope-signer-header.tsx(51,18): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.307 app/components/general/envelope-signing/envelope-signer-header.tsx(54,12): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.307 app/components/general/envelope-signing/envelope-signer-header.tsx(61,14): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.307 app/components/general/envelope-signing/envelope-signer-header.tsx(65,20): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.307 app/components/general/envelope-signing/envelope-signer-header.tsx(111,23): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.307 app/components/general/envelope-signing/envelope-signer-header.tsx(112,27): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.308 app/components/general/envelope-signing/envelope-signer-header.tsx(113,26): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.308 app/components/general/envelope-signing/envelope-signer-header.tsx(114,18): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.308 app/components/general/envelope-signing/envelope-signer-header.tsx(125,10): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.308 app/components/general/envelope-signing/envelope-signer-header.tsx(127,52): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.308 app/components/general/envelope-signing/envelope-signer-header.tsx(128,20): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.308 app/components/general/envelope-signing/envelope-signer-page-renderer.tsx(5,8): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.308 app/components/general/envelope-signing/envelope-signer-page-renderer.tsx(6,3): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.308 app/components/general/envelope-signing/envelope-signer-page-renderer.tsx(7,8): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.308 app/components/general/envelope-signing/envelope-signer-page-renderer.tsx(8,3): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.308 app/components/general/envelope-signing/envelope-signer-page-renderer.tsx(9,8): error TS2305: Module '"@prisma/client"' has no exported member 'Signature'.
12:20:00.308 app/components/general/envelope-signing/envelope-signer-page-renderer.tsx(10,3): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.308 app/components/general/envelope-signing/envelope-signer-page-renderer.tsx(97,9): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.308 app/components/general/envelope-signing/envelope-signer-page-renderer.tsx(112,30): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.308 app/components/general/envelope-signing/envelope-signer-page-renderer.tsx(113,8): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.308 app/components/general/envelope-signing/envelope-signer-page-renderer.tsx(116,38): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.309 app/components/general/envelope-signing/envelope-signer-page-renderer.tsx(119,12): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.309 app/components/general/envelope-signing/envelope-signer-page-renderer.tsx(124,15): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.309 app/components/general/envelope-signing/envelope-signer-page-renderer.tsx(135,7): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.309 app/components/general/envelope-signing/envelope-signer-page-renderer.tsx(189,11): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.309 app/components/general/envelope-signing/envelope-signer-page-renderer.tsx(196,65): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.309 app/components/general/envelope-signing/envelope-signer-page-renderer.tsx(297,28): error TS2339: Property 'value' does not exist on type 'never'.
12:20:00.309 app/components/general/envelope-signing/envelope-signer-page-renderer.tsx(298,34): error TS2339: Property 'value' does not exist on type 'never'.
12:20:00.309 app/components/general/envelope-signing/envelope-signer-page-renderer.tsx(333,28): error TS2339: Property 'value' does not exist on type 'never'.
12:20:00.309 app/components/general/envelope-signing/envelope-signer-page-renderer.tsx(334,37): error TS2339: Property 'value' does not exist on type 'never'.
12:20:00.310 app/components/general/envelope-signing/envelope-signer-page-renderer.tsx(378,36): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.310 app/components/general/envelope-signing/envelope-signer-page-renderer.tsx(379,37): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.310 app/components/general/envelope-signing/envelope-signer-page-renderer.tsx(380,35): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.310 app/components/general/envelope-signing/envelope-signer-page-renderer.tsx(386,29): error TS2339: Property 'value' does not exist on type 'never'.
12:20:00.310 app/components/general/envelope-signing/envelope-signer-page-renderer.tsx(396,40): error TS2339: Property 'value' does not exist on type 'never'.
12:20:00.310 app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.310 app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx(87,16): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.313 app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx(88,48): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.313 app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx(95,19): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.316 app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx(96,21): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.316 app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx(102,18): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.316 app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx(103,50): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.316 app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx(104,24): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.316 app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx(105,23): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.316 app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx(113,11): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.316 app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx(114,32): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.322 app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx(116,33): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.323 app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx(150,12): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.323 app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx(155,30): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.323 app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx(159,28): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.323 app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx(160,28): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.323 app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx(160,50): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.323 app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx(179,27): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.323 app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx(214,11): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.323 app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx(215,11): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.323 app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx(215,34): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.323 app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx(218,11): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.323 app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx(219,11): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.323 app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx(219,34): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.323 app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx(228,42): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.323 app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx(228,59): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.323 app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx(228,75): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.323 app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx(237,22): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.323 app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx(240,7): error TS2322: Type 'unknown' is not assignable to type 'Pick<Recipient, "name" | "token" | "email" | "role">'.
12:20:00.323 app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx(242,26): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.323 app/components/general/envelope-signing/envelope-signing-complete-dialog.tsx(244,46): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.323 app/components/general/envelope/envelope-drop-zone-wrapper.tsx(6,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.323 app/components/general/envelope/envelope-upload-button.tsx(6,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.323 app/components/general/folder/folder-card.tsx(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'FolderType'.
12:20:00.323 app/components/general/folder/folder-grid.tsx(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'FolderType'.
12:20:00.323 app/components/general/multiselect-role-combobox.tsx(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'Role'.
12:20:00.323 app/components/general/multiselect-role-combobox.tsx(67,27): error TS2345: Argument of type '(value: string, i: number) => JSX.Element' is not assignable to parameter of type '(value: unknown, index: number, array: unknown[]) => Element'.
12:20:00.323 Types of parameters 'value' and 'value' are incompatible.
12:20:00.323 Type 'unknown' is not assignable to type 'string'.
12:20:00.323 app/components/general/org-menu-switcher.tsx(61,43): error TS7006: Parameter 'org' implicitly has an 'any' type.
12:20:00.323 app/components/general/org-menu-switcher.tsx(63,6): error TS7006: Parameter 'org' implicitly has an 'any' type.
12:20:00.323 app/components/general/org-menu-switcher.tsx(157,35): error TS7006: Parameter 'org' implicitly has an 'any' type.
12:20:00.324 app/components/general/org-menu-switcher.tsx(218,41): error TS7006: Parameter 'team' implicitly has an 'any' type.
12:20:00.324 app/components/general/organisations/organisation-billing-banner.tsx(6,10): error TS2305: Module '"@prisma/client"' has no exported member 'SubscriptionStatus'.
12:20:00.324 app/components/general/organisations/organisation-invitations.tsx(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberInviteStatus'.
12:20:00.324 app/components/general/organisations/organisation-invitations.tsx(85,32): error TS7006: Parameter 'invitation' implicitly has an 'any' type.
12:20:00.324 app/components/general/portal.tsx(3,30): error TS7016: Could not find a declaration file for module 'react-dom'. '/vercel/path0/node*modules/react-dom/index.js' implicitly has an 'any' type.
12:20:00.324 Try `npm i --save-dev @types/react-dom` if it exists or add a new declaration (.d.ts) file containing `declare module 'react-dom';`
12:20:00.324 app/components/general/settings-nav-desktop.tsx(32,56): error TS7006: Parameter 'org' implicitly has an 'any' type.
12:20:00.324 app/components/general/settings-nav-mobile.tsx(33,56): error TS7006: Parameter 'org' implicitly has an 'any' type.
12:20:00.324 app/components/general/stack-avatars-with-tooltip.tsx(5,15): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.324 app/components/general/stack-avatars-with-tooltip.tsx(5,36): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.324 app/components/general/stack-avatars.tsx(3,15): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.324 app/components/general/teams/team-email-usage.tsx(6,15): error TS2305: Module '"@prisma/client"' has no exported member 'TeamEmail'.
12:20:00.324 app/components/general/teams/team-inherit-member-alert.tsx(2,15): error TS2305: Module '"@prisma/client"' has no exported member 'TeamGroup'.
12:20:00.324 app/components/general/template/template-edit-form.tsx(61,7): error TS2769: No overload matches this call.
12:20:00.324 Overload 1 of 2, '(input: { templateId: number; } | typeof skipToken, opts: DefinedUseTRPCQueryOptions<{ [x: string]: any; type?: unknown; id?: unknown; createdAt?: unknown; updatedAt?: unknown; userId?: unknown; teamId?: unknown; title?: unknown; authOptions?: unknown; externalId?: unknown; visibility?: unknown; folderId?: unknown; ... 11 more ...; envelopeItems?: unknown; }, { ...; }, TRPCClientErrorLike<...>, { ...; }>): DefinedUseTRPCQueryResult<...>', gave the following error.
12:20:00.324 Type 'unknown' is not assignable to type 'number'.
12:20:00.324 Overload 2 of 2, '(input: { templateId: number; } | typeof skipToken, opts?: UseTRPCQueryOptions<{ [x: string]: any; type?: unknown; id?: unknown; createdAt?: unknown; updatedAt?: unknown; userId?: unknown; teamId?: unknown; title?: unknown; authOptions?: unknown; externalId?: unknown; visibility?: unknown; folderId?: unknown; ... 11 more ...; envelopeItems?: unknown; }, { ...; }, TRPCClientErrorLike<...>, { ...; }> | undefined): UseTRPCQueryResult<...>', gave the following error.
12:20:00.324 Type 'unknown' is not assignable to type 'number'.
12:20:00.324 app/components/general/template/template-edit-form.tsx(96,11): error TS2322: Type 'unknown' is not assignable to type 'number'.
12:20:00.324 app/components/general/template/template-edit-form.tsx(108,11): error TS2322: Type 'unknown' is not assignable to type 'number'.
12:20:00.324 app/components/general/template/template-edit-form.tsx(120,11): error TS2322: Type 'unknown' is not assignable to type 'number'.
12:20:00.324 app/components/general/template/template-edit-form.tsx(128,13): error TS2339: Property 'signatureTypes' does not exist on type 'unknown'.
12:20:00.324 app/components/general/template/template-edit-form.tsx(135,7): error TS2322: Type 'unknown' is not assignable to type 'number'.
12:20:00.324 app/components/general/template/template-edit-form.tsx(144,9): error TS2698: Spread types may only be created from object types.
12:20:00.324 app/components/general/template/template-edit-form.tsx(145,23): error TS18046: 'data.meta' is of type 'unknown'.
12:20:00.324 app/components/general/template/template-edit-form.tsx(149,39): error TS18046: 'data.meta' is of type 'unknown'.
12:20:00.324 app/components/general/template/template-edit-form.tsx(149,61): error TS18046: 'data.meta' is of type 'unknown'.
12:20:00.324 app/components/general/template/template-edit-form.tsx(187,9): error TS2322: Type 'unknown' is not assignable to type 'number'.
12:20:00.324 app/components/general/template/template-edit-form.tsx(195,9): error TS2322: Type 'unknown' is not assignable to type 'number'.
12:20:00.324 app/components/general/template/template-edit-form.tsx(196,21): error TS18046: 'data.signers' is of type 'unknown'.
12:20:00.325 app/components/general/template/template-edit-form.tsx(196,39): error TS7006: Parameter 'signer' implicitly has an 'any' type.
12:20:00.325 app/components/general/template/template-edit-form.tsx(242,7): error TS2322: Type 'unknown' is not assignable to type 'number'.
12:20:00.325 app/components/general/template/template-edit-form.tsx(246,25): error TS18046: 'template.templateDocumentData' is of type 'unknown'.
12:20:00.325 app/components/general/template/template-edit-form.tsx(316,18): error TS18046: 'template.envelopeItems' is of type 'unknown'.
12:20:00.325 app/components/general/template/template-edit-form.tsx(317,27): error TS18046: 'template.envelopeItems' is of type 'unknown'.
12:20:00.325 app/components/general/template/template-edit-form.tsx(335,20): error TS18046: 'recipients' is of type 'unknown'.
12:20:00.325 app/components/general/template/template-edit-form.tsx(339,15): error TS2322: Type 'unknown' is not assignable to type 'Recipient[]'.
12:20:00.325 app/components/general/template/template-edit-form.tsx(340,15): error TS2322: Type 'unknown' is not assignable to type 'Field[]'.
12:20:00.325 app/components/general/template/template-edit-form.tsx(347,15): error TS2322: Type 'unknown' is not assignable to type 'Key | null | undefined'.
12:20:00.325 app/components/general/template/template-edit-form.tsx(349,15): error TS2322: Type 'unknown' is not assignable to type 'Recipient[]'.
12:20:00.325 app/components/general/template/template-edit-form.tsx(350,15): error TS2322: Type 'unknown' is not assignable to type 'Field[]'.
12:20:00.325 app/components/general/template/template-edit-form.tsx(351,52): error TS2339: Property 'signingOrder' does not exist on type '{}'.
12:20:00.325 app/components/general/template/template-edit-form.tsx(352,62): error TS2339: Property 'allowDictateNextSigner' does not exist on type '{}'.
12:20:00.325 app/components/general/template/template-edit-form.tsx(355,15): error TS2322: Type '(data: TAddTemplatePlacholderRecipientsFormSchema) => Promise<{ [x: string]: any; recipients?: unknown; }>' is not assignable to type '(\_data: { [x: string]: any; signers?: unknown; signingOrder?: unknown; allowDictateNextSigner?: unknown; }) => Promise<AutoSaveResponse>'.
12:20:00.325 Type 'Promise<{ [x: string]: any; recipients?: unknown; }>' is not assignable to type 'Promise<AutoSaveResponse>'.
12:20:00.325 Type '{ [x: string]: any; recipients?: unknown; }' is not assignable to type 'AutoSaveResponse'.
12:20:00.325 Types of property 'recipients' are incompatible.
12:20:00.325 Type 'unknown' is not assignable to type 'Recipient[]'.
12:20:00.325 app/components/general/template/template-edit-form.tsx(360,15): error TS2322: Type 'unknown' is not assignable to type 'Key | null | undefined'.
12:20:00.325 app/components/general/template/template-edit-form.tsx(362,15): error TS2322: Type 'unknown' is not assignable to type 'Recipient[]'.
12:20:00.325 app/components/general/template/template-edit-form.tsx(363,15): error TS2322: Type 'unknown' is not assignable to type 'Field[]'.
12:20:00.325 app/components/general/template/template-page-view-documents-table.tsx(7,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSource'.
12:20:00.325 app/components/general/template/template-page-view-documents-table.tsx(7,26): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.325 app/components/general/template/template-page-view-documents-table.tsx(104,21): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string | number | Date | undefined'.
12:20:00.325 app/components/general/template/template-page-view-documents-table.tsx(116,13): error TS2322: Type 'unknown' is not assignable to type 'Recipient[]'.
12:20:00.325 app/components/general/template/template-page-view-documents-table.tsx(167,39): error TS2538: Type 'unknown' cannot be used as an index type.
12:20:00.325 app/components/general/template/template-page-view-information.tsx(6,15): error TS2305: Module '"@prisma/client"' has no exported member 'User'.
12:20:00.325 app/components/general/template/template-page-view-recent-activity.tsx(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSource'.
12:20:00.325 app/components/general/template/template-page-view-recent-activity.tsx(101,19): error TS2322: Type 'unknown' is not assignable to type 'Key | null | undefined'.
12:20:00.325 app/components/general/template/template-page-view-recent-activity.tsx(122,74): error TS18046: 'document.user' is of type 'unknown'.
12:20:00.326 app/components/general/template/template-page-view-recent-activity.tsx(130,22): error TS2349: This expression is not callable.
12:20:00.326 Type 'NonExhaustiveError<unknown>' has no call signatures.
12:20:00.326 app/components/general/template/template-page-view-recent-activity.tsx(134,40): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'Date'.
12:20:00.326 app/components/general/template/template-page-view-recipients.tsx(4,15): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.326 app/components/general/template/template-type.tsx(6,15): error TS2305: Module '"@prisma/client"' has no exported member 'TemplateType'.
12:20:00.326 app/components/general/webhook-logs-sheet.tsx(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'WebhookCallStatus'.
12:20:00.326 app/components/general/webhook-logs-sheet.tsx(18,50): error TS2537: Type 'unknown' has no matching index signature for type 'number'.
12:20:00.326 app/components/general/webhook-multiselect-combobox.tsx(3,10): error TS2305: Module '"@prisma/client"' has no exported member 'WebhookTriggerEvents'.
12:20:00.326 app/components/general/webhook-multiselect-combobox.tsx(15,37): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string'.
12:20:00.326 app/components/general/webhook-multiselect-combobox.tsx(38,7): error TS2322: Type '{ value: unknown; label: string; }[]' is not assignable to type 'Option[]'.
12:20:00.326 Type '{ value: unknown; label: string; }' is not assignable to type 'Option'.
12:20:00.326 Types of property 'value' are incompatible.
12:20:00.326 Type 'unknown' is not assignable to type 'string'.
12:20:00.326 app/components/tables/admin-claims-table.tsx(154,61): error TS2537: Type 'unknown' has no matching index signature for type 'number'.
12:20:00.326 app/components/tables/admin-claims-table.tsx(161,9): error TS2322: Type 'unknown' is not assignable to type 'any[]'.
12:20:00.326 app/components/tables/admin-claims-table.tsx(162,9): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.326 app/components/tables/admin-claims-table.tsx(163,9): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.326 app/components/tables/admin-claims-table.tsx(164,9): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.326 app/components/tables/admin-dashboard-users-table.tsx(5,15): error TS2305: Module '"@prisma/client"' has no exported member 'Role'.
12:20:00.326 app/components/tables/admin-dashboard-users-table.tsx(5,21): error TS2305: Module '"@prisma/client"' has no exported member 'Subscription'.
12:20:00.326 app/components/tables/admin-document-jobs-table.tsx(76,61): error TS2537: Type 'unknown' has no matching index signature for type 'number'.
12:20:00.326 app/components/tables/admin-document-jobs-table.tsx(93,9): error TS2322: Type 'unknown' is not assignable to type 'any[]'.
12:20:00.326 app/components/tables/admin-document-jobs-table.tsx(94,9): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.326 app/components/tables/admin-document-jobs-table.tsx(95,9): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.326 app/components/tables/admin-document-jobs-table.tsx(96,9): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.326 app/components/tables/admin-document-jobs-table.tsx(129,11): error TS18046: 'results.totalPages' is of type 'unknown'.
12:20:00.326 app/components/tables/admin-document-recipient-item-table.tsx(6,15): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.326 app/components/tables/admin-document-recipient-item-table.tsx(6,27): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.326 app/components/tables/admin-document-recipient-item-table.tsx(6,43): error TS2305: Module '"@prisma/client"' has no exported member 'Signature'.
12:20:00.326 app/components/tables/admin-document-recipient-item-table.tsx(6,54): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.326 app/components/tables/admin-organisations-table.tsx(179,61): error TS2537: Type 'unknown' has no matching index signature for type 'number'.
12:20:00.327 app/components/tables/admin-organisations-table.tsx(186,9): error TS2322: Type 'unknown' is not assignable to type 'any[]'.
12:20:00.327 app/components/tables/admin-organisations-table.tsx(187,9): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.327 app/components/tables/admin-organisations-table.tsx(188,9): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.327 app/components/tables/admin-organisations-table.tsx(189,9): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.327 app/components/tables/document-logs-table.tsx(8,26): error TS7016: Could not find a declaration file for module 'ua-parser-js'. '/vercel/path0/node_modules/ua-parser-js/src/ua-parser.js' implicitly has an 'any' type.
12:20:00.327 Try `npm i --save-dev @types/ua-parser-js` if it exists or add a new declaration (.d.ts) file containing `declare module 'ua-parser-js';`
12:20:00.327 app/components/tables/documents-table-action-button.tsx(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.327 app/components/tables/documents-table-action-button.tsx(2,26): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.327 app/components/tables/documents-table-action-button.tsx(2,41): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.327 app/components/tables/documents-table-action-button.tsx(26,21): error TS18046: 'row.recipients' is of type 'unknown'.
12:20:00.327 app/components/tables/documents-table-action-button.tsx(26,42): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.327 app/components/tables/documents-table-action-button.tsx(28,19): error TS18046: 'row.user' is of type 'unknown'.
12:20:00.327 app/components/tables/documents-table-action-button.tsx(35,51): error TS2339: Property 'url' does not exist on type '{}'.
12:20:00.327 app/components/tables/documents-table-action-button.tsx(99,9): error TS2322: Type 'unknown' is not assignable to type 'string'.
12:20:00.327 app/components/tables/documents-table-action-dropdown.tsx(6,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.327 app/components/tables/documents-table-action-dropdown.tsx(6,26): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.327 app/components/tables/documents-table-action-dropdown.tsx(60,21): error TS18046: 'row.recipients' is of type 'unknown'.
12:20:00.327 app/components/tables/documents-table-action-dropdown.tsx(60,42): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.327 app/components/tables/documents-table-action-dropdown.tsx(62,19): error TS18046: 'row.user' is of type 'unknown'.
12:20:00.327 app/components/tables/documents-table-action-dropdown.tsx(68,51): error TS2339: Property 'url' does not exist on type '{}'.
12:20:00.327 app/components/tables/documents-table-action-dropdown.tsx(74,31): error TS18046: 'row.recipients' is of type 'unknown'.
12:20:00.327 app/components/tables/documents-table-action-dropdown.tsx(74,54): error TS7006: Parameter 'item' implicitly has an 'any' type.
12:20:00.327 app/components/tables/documents-table-action-dropdown.tsx(125,11): error TS2322: Type 'unknown' is not assignable to type 'string'.
12:20:00.327 app/components/tables/documents-table-action-dropdown.tsx(167,13): error TS2322: Type 'unknown' is not assignable to type 'Recipient[]'.
12:20:00.327 app/components/tables/documents-table-action-dropdown.tsx(179,31): error TS2322: Type '{ [x: string]: any; id?: unknown; source?: unknown; status?: unknown; createdAt?: unknown; updatedAt?: unknown; userId?: unknown; completedAt?: unknown; deletedAt?: unknown; teamId?: unknown; title?: unknown; authOptions?: unknown; externalId?: unknown; formValues?: unknown; visibility?: unknown; useLegacyFieldInser...' is not assignable to type 'Pick<{ [x: string]: any; visibility?: unknown; status?: unknown; source?: unknown; id?: unknown; qrToken?: unknown; externalId?: unknown; userId?: unknown; teamId?: unknown; authOptions?: unknown; formValues?: unknown; title?: unknown; documentDataId?: unknown; createdAt?: unknown; updatedAt?: unknown; completedAt?:...'.
12:20:00.327 Type '{ [x: string]: any; id?: unknown; source?: unknown; status?: unknown; createdAt?: unknown; updatedAt?: unknown; userId?: unknown; completedAt?: unknown; deletedAt?: unknown; teamId?: unknown; title?: unknown; authOptions?: unknown; externalId?: unknown; formValues?: unknown; visibility?: unknown; useLegacyFieldInser...' is not assignable to type '{ user: Pick<User, "id" | "name" | "email">; recipients: Recipient[]; team: Pick<Team, "id" | "url"> | null; }'.
12:20:00.327 Types of property 'user' are incompatible.
12:20:00.327 Type 'unknown' is not assignable to type 'Pick<User, "id" | "name" | "email">'.
12:20:00.327 app/components/tables/documents-table-action-dropdown.tsx(182,11): error TS2322: Type 'unknown' is not assignable to type 'number'.
12:20:00.327 app/components/tables/documents-table-action-dropdown.tsx(196,9): error TS2322: Type 'unknown' is not assignable to type 'number'.
12:20:00.328 app/components/tables/documents-table-action-dropdown.tsx(198,9): error TS2322: Type 'unknown' is not assignable to type 'string'.
12:20:00.328 app/components/tables/documents-table-action-dropdown.tsx(205,9): error TS2322: Type 'unknown' is not assignable to type 'string'.
12:20:00.328 app/components/tables/documents-table-sender-filter.tsx(28,45): error TS7006: Parameter 'member' implicitly has an 'any' type.
12:20:00.328 app/components/tables/documents-table-title.tsx(16,21): error TS18046: 'row.recipients' is of type 'unknown'.
12:20:00.328 app/components/tables/documents-table-title.tsx(16,42): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.328 app/components/tables/documents-table-title.tsx(18,19): error TS18046: 'row.user' is of type 'unknown'.
12:20:00.328 app/components/tables/documents-table-title.tsx(20,54): error TS2339: Property 'url' does not exist on type '{}'.
12:20:00.328 app/components/tables/documents-table-title.tsx(32,9): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.328 app/components/tables/documents-table-title.tsx(35,9): error TS2322: Type 'unknown' is not assignable to type 'ReactNode'.
12:20:00.328 app/components/tables/documents-table-title.tsx(41,9): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.328 app/components/tables/documents-table-title.tsx(44,9): error TS2322: Type 'unknown' is not assignable to type 'ReactNode'.
12:20:00.328 app/components/tables/documents-table-title.tsx(49,9): error TS2322: Type 'unknown' is not assignable to type 'ReactNode'.
12:20:00.328 app/components/tables/documents-table.tsx(56,21): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string | number | Date | undefined'.
12:20:00.328 app/components/tables/documents-table.tsx(65,28): error TS18046: 'row.original.user' is of type 'unknown'.
12:20:00.328 app/components/tables/documents-table.tsx(65,54): error TS18046: 'row.original.user' is of type 'unknown'.
12:20:00.328 app/components/tables/documents-table.tsx(72,13): error TS2322: Type 'unknown' is not assignable to type 'Recipient[]'.
12:20:00.328 app/components/tables/documents-table.tsx(91,71): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'number'.
12:20:00.328 app/components/tables/documents-table.tsx(176,21): error TS18046: 'row.recipients' is of type 'unknown'.
12:20:00.328 app/components/tables/documents-table.tsx(176,42): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.328 app/components/tables/documents-table.tsx(178,19): error TS18046: 'row.user' is of type 'unknown'.
12:20:00.328 app/components/tables/documents-table.tsx(180,54): error TS2339: Property 'url' does not exist on type '{}'.
12:20:00.328 app/components/tables/documents-table.tsx(193,9): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.328 app/components/tables/documents-table.tsx(196,9): error TS2322: Type 'unknown' is not assignable to type 'ReactNode'.
12:20:00.328 app/components/tables/documents-table.tsx(202,9): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.328 app/components/tables/documents-table.tsx(205,9): error TS2322: Type 'unknown' is not assignable to type 'ReactNode'.
12:20:00.328 app/components/tables/documents-table.tsx(210,9): error TS2322: Type 'unknown' is not assignable to type 'ReactNode'.
12:20:00.328 app/components/tables/inbox-table.tsx(6,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.328 app/components/tables/inbox-table.tsx(7,10): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.328 app/components/tables/inbox-table.tsx(7,25): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.329 app/components/tables/inbox-table.tsx(63,21): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string | number | Date | undefined'.
12:20:00.329 app/components/tables/inbox-table.tsx(69,13): error TS2322: Type 'unknown' is not assignable to type 'ReactNode'.
12:20:00.329 app/components/tables/inbox-table.tsx(76,28): error TS18046: 'row.original.user' is of type 'unknown'.
12:20:00.329 app/components/tables/inbox-table.tsx(76,54): error TS18046: 'row.original.user' is of type 'unknown'.
12:20:00.329 app/components/tables/inbox-table.tsx(83,13): error TS2322: Type 'unknown' is not assignable to type 'Recipient[]'.
12:20:00.329 app/components/tables/inbox-table.tsx(190,21): error TS18046: 'row.recipients' is of type 'unknown'.
12:20:00.329 app/components/tables/inbox-table.tsx(190,42): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.329 app/components/tables/inbox-table.tsx(245,9): error TS2322: Type 'unknown' is not assignable to type 'string'.
12:20:00.329 app/components/tables/internal-audit-log-table.tsx(6,26): error TS7016: Could not find a declaration file for module 'ua-parser-js'. '/vercel/path0/node_modules/ua-parser-js/src/ua-parser.js' implicitly has an 'any' type.
12:20:00.329 Try `npm i --save-dev @types/ua-parser-js` if it exists or add a new declaration (.d.ts) file containing `declare module 'ua-parser-js';`
12:20:00.330 app/components/tables/organisation-email-domains-table.tsx(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'EmailDomainStatus'.
12:20:00.330 app/components/tables/organisation-groups-table.tsx(6,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationGroupType'.
12:20:00.330 app/components/tables/organisation-groups-table.tsx(100,61): error TS2537: Type 'unknown' has no matching index signature for type 'number'.
12:20:00.330 app/components/tables/organisation-groups-table.tsx(106,7): error TS2322: Type 'unknown' is not assignable to type 'any[]'.
12:20:00.330 app/components/tables/organisation-groups-table.tsx(107,7): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.330 app/components/tables/organisation-groups-table.tsx(108,7): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.330 app/components/tables/organisation-groups-table.tsx(109,7): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.330 app/components/tables/organisation-groups-table.tsx(143,9): error TS18046: 'results.totalPages' is of type 'unknown'.
12:20:00.330 app/components/tables/organisation-member-invites-table.tsx(6,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberInviteStatus'.
12:20:00.330 app/components/tables/organisation-member-invites-table.tsx(167,61): error TS2537: Type 'unknown' has no matching index signature for type 'number'.
12:20:00.330 app/components/tables/organisation-member-invites-table.tsx(173,7): error TS2322: Type 'unknown' is not assignable to type 'any[]'.
12:20:00.330 app/components/tables/organisation-member-invites-table.tsx(174,7): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.330 app/components/tables/organisation-member-invites-table.tsx(175,7): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.330 app/components/tables/organisation-member-invites-table.tsx(176,7): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.330 app/components/tables/organisation-member-invites-table.tsx(206,9): error TS18046: 'results.totalPages' is of type 'unknown'.
12:20:00.330 app/components/tables/organisation-members-table.tsx(6,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationGroupType'.
12:20:00.330 app/components/tables/organisation-members-table.tsx(106,39): error TS7006: Parameter 'group' implicitly has an 'any' type.
12:20:00.330 app/components/tables/organisation-members-table.tsx(170,61): error TS2537: Type 'unknown' has no matching index signature for type 'number'.
12:20:00.330 app/components/tables/organisation-members-table.tsx(176,7): error TS2322: Type 'unknown' is not assignable to type 'any[]'.
12:20:00.330 app/components/tables/organisation-members-table.tsx(177,7): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.330 app/components/tables/organisation-members-table.tsx(178,7): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.330 app/components/tables/organisation-members-table.tsx(179,7): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.330 app/components/tables/organisation-members-table.tsx(213,9): error TS18046: 'results.totalPages' is of type 'unknown'.
12:20:00.330 app/components/tables/organisation-teams-table.tsx(101,61): error TS2537: Type 'unknown' has no matching index signature for type 'number'.
12:20:00.330 app/components/tables/organisation-teams-table.tsx(107,7): error TS2322: Type 'unknown' is not assignable to type 'any[]'.
12:20:00.330 app/components/tables/organisation-teams-table.tsx(108,7): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.330 app/components/tables/organisation-teams-table.tsx(109,7): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.330 app/components/tables/organisation-teams-table.tsx(110,7): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.330 app/components/tables/organisation-teams-table.tsx(147,9): error TS18046: 'results.totalPages' is of type 'unknown'.
12:20:00.330 app/components/tables/settings-public-profile-templates-table.tsx(6,15): error TS2305: Module '"@prisma/client"' has no exported member 'TemplateDirectLink'.
12:20:00.330 app/components/tables/settings-public-profile-templates-table.tsx(6,35): error TS2305: Module '"@prisma/client"' has no exported member 'TemplateType'.
12:20:00.330 app/components/tables/settings-public-profile-templates-table.tsx(49,70): error TS2339: Property 'enabled' does not exist on type '{}'.
12:20:00.330 app/components/tables/settings-public-profile-templates-table.tsx(135,13): error TS2322: Type 'unknown' is not assignable to type 'Key | null | undefined'.
12:20:00.330 app/components/tables/settings-public-profile-templates-table.tsx(145,40): error TS2322: Type 'unknown' is not assignable to type 'ReactNode'.
12:20:00.331 app/components/tables/settings-public-profile-templates-table.tsx(146,57): error TS2322: Type 'unknown' is not assignable to type 'ReactNode'.
12:20:00.331 app/components/tables/settings-public-profile-templates-table.tsx(169,23): error TS2322: Type 'unknown' is not assignable to type 'number'.
12:20:00.331 app/components/tables/settings-public-profile-templates-table.tsx(181,23): error TS2322: Type 'unknown' is not assignable to type 'number'.
12:20:00.331 app/components/tables/settings-security-activity-table.tsx(8,26): error TS7016: Could not find a declaration file for module 'ua-parser-js'. '/vercel/path0/node_modules/ua-parser-js/src/ua-parser.js' implicitly has an 'any' type.
12:20:00.331 Try `npm i --save-dev @types/ua-parser-js` if it exists or add a new declaration (.d.ts) file containing `declare module 'ua-parser-js';`
12:20:00.331 app/components/tables/team-groups-table.tsx(6,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationGroupType'.
12:20:00.331 app/components/tables/team-groups-table.tsx(127,61): error TS2537: Type 'unknown' has no matching index signature for type 'number'.
12:20:00.331 app/components/tables/team-groups-table.tsx(133,7): error TS2322: Type 'unknown' is not assignable to type 'any[]'.
12:20:00.331 app/components/tables/team-groups-table.tsx(134,7): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.331 app/components/tables/team-groups-table.tsx(135,7): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.331 app/components/tables/team-groups-table.tsx(136,7): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.331 app/components/tables/team-groups-table.tsx(177,9): error TS18046: 'results.totalPages' is of type 'unknown'.
12:20:00.331 app/components/tables/team-members-table.tsx(6,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationGroupType'.
12:20:00.331 app/components/tables/team-members-table.tsx(6,33): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberRole'.
12:20:00.331 app/components/tables/team-members-table.tsx(84,40): error TS2339: Property 'find' does not exist on type '{}'.
12:20:00.331 app/components/tables/team-members-table.tsx(85,6): error TS7006: Parameter 'group' implicitly has an 'any' type.
12:20:00.331 app/components/tables/team-members-table.tsx(119,49): error TS2339: Property 'find' does not exist on type '{}'.
12:20:00.331 app/components/tables/team-members-table.tsx(120,14): error TS7006: Parameter 'group' implicitly has an 'any' type.
12:20:00.331 app/components/tables/team-members-table.tsx(122,35): error TS7006: Parameter 'member' implicitly has an 'any' type.
12:20:00.331 app/components/tables/team-members-table.tsx(187,61): error TS2537: Type 'unknown' has no matching index signature for type 'number'.
12:20:00.331 app/components/tables/team-members-table.tsx(194,9): error TS2322: Type 'unknown' is not assignable to type 'any[]'.
12:20:00.331 app/components/tables/team-members-table.tsx(195,9): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.331 app/components/tables/team-members-table.tsx(196,9): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.331 app/components/tables/team-members-table.tsx(197,9): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.331 app/components/tables/templates-table-action-dropdown.tsx(4,15): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.331 app/components/tables/templates-table-action-dropdown.tsx(4,26): error TS2305: Module '"@prisma/client"' has no exported member 'TemplateDirectLink'.
12:20:00.331 app/components/tables/templates-table.tsx(67,38): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string | number | Date | undefined'.
12:20:00.331 app/components/tables/templates-table.tsx(76,13): error TS2322: Type 'unknown' is not assignable to type 'ReactNode'.
12:20:00.331 app/components/tables/templates-table.tsx(145,39): error TS2339: Property 'token' does not exist on type '{}'.
12:20:00.331 app/components/tables/templates-table.tsx(148,48): error TS2339: Property 'token' does not exist on type '{}'.
12:20:00.331 app/components/tables/templates-table.tsx(149,50): error TS2339: Property 'enabled' does not exist on type '{}'.
12:20:00.331 app/components/tables/templates-table.tsx(162,17): error TS2322: Type 'unknown' is not assignable to type 'string'.
12:20:00.331 app/components/tables/templates-table.tsx(163,17): error TS2322: Type 'unknown' is not assignable to type 'number'.
12:20:00.331 app/components/tables/templates-table.tsx(164,66): error TS2339: Property 'signingOrder' does not exist on type '{}'.
12:20:00.331 app/components/tables/templates-table.tsx(165,72): error TS2339: Property 'distributionMethod' does not exist on type '{}'.
12:20:00.331 app/components/tables/templates-table.tsx(166,17): error TS2322: Type 'unknown' is not assignable to type 'Recipient[]'.
12:20:00.332 app/components/tables/templates-table.tsx(171,17): error TS2322: Type '{ [x: string]: any; type?: unknown; id?: unknown; createdAt?: unknown; updatedAt?: unknown; userId?: unknown; teamId?: unknown; title?: unknown; authOptions?: unknown; externalId?: unknown; visibility?: unknown; useLegacyFieldInsertion?: unknown; folderId?: unknown; publicTitle?: unknown; publicDescription?: unknown...' is not assignable to type '{ id: number; userId: number; teamId: number; title: string; folderId?: string | null | undefined; envelopeId: string; directLink?: Pick<TemplateDirectLink, "token" | "enabled"> | null | undefined; recipients: Recipient[]; }'.
12:20:00.332 Types of property 'id' are incompatible.
12:20:00.332 Type 'unknown' is not assignable to type 'number'.
12:20:00.332 app/components/tables/user-billing-organisations-table.tsx(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'SubscriptionStatus'.
12:20:00.332 app/components/tables/user-billing-organisations-table.tsx(23,34): error TS7006: Parameter 'org' implicitly has an 'any' type.
12:20:00.332 app/components/tables/user-organisations-table.tsx(28,37): error TS7006: Parameter 'org' implicitly has an 'any' type.
12:20:00.332 app/entry.client.tsx(7,29): error TS7016: Could not find a declaration file for module 'react-dom/client'. '/vercel/path0/node_modules/react-dom/client.js' implicitly has an 'any' type.
12:20:00.332 Try `npm i --save-dev @types/react-dom` if it exists or add a new declaration (.d.ts) file containing `declare module 'react-dom/client';`
12:20:00.332 app/entry.server.tsx(6,52): error TS7016: Could not find a declaration file for module 'react-dom/server'. '/vercel/path0/node_modules/react-dom/server.node.js' implicitly has an 'any' type.
12:20:00.332 Try `npm i --save-dev @types/react-dom` if it exists or add a new declaration (.d.ts) file containing `declare module 'react-dom/server';`
12:20:00.332 app/entry.server.tsx(7,40): error TS7016: Could not find a declaration file for module 'react-dom/server'. '/vercel/path0/node_modules/react-dom/server.node.js' implicitly has an 'any' type.
12:20:00.332 Try `npm i --save-dev @types/react-dom` if it exists or add a new declaration (.d.ts) file containing `declare module 'react-dom/server';`
12:20:00.332 app/routes/\_authenticated+/\_layout.tsx(54,40): error TS7006: Parameter 'org' implicitly has an 'any' type.
12:20:00.332 app/routes/\_authenticated+/\_layout.tsx(58,34): error TS7006: Parameter 'org' implicitly has an 'any' type.
12:20:00.332 app/routes/\_authenticated+/\_layout.tsx(63,34): error TS7006: Parameter 'org' implicitly has an 'any' type.
12:20:00.332 app/routes/\_authenticated+/\_layout.tsx(63,58): error TS7006: Parameter 'team' implicitly has an 'any' type.
12:20:00.332 app/routes/\_authenticated+/\_layout.tsx(69,35): error TS7006: Parameter 'team' implicitly has an 'any' type.
12:20:00.332 app/routes/\_authenticated+/admin+/documents.$id.tsx(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.332 app/routes/_authenticated+/admin+/documents.$id.tsx(4,24): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.332 app/routes/\_authenticated+/admin+/documents.$id.tsx(4,39): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.340 app/routes/_authenticated+/admin+/documents.$id.tsx(113,20): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.340 app/routes/\_authenticated+/admin+/documents.$id.tsx(147,37): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.340 app/routes/_authenticated+/admin+/documents._index.tsx(59,38): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string | number | Date | undefined'.
12:20:00.340 app/routes/_authenticated+/admin+/documents._index.tsx(70,15): error TS2322: Type 'unknown' is not assignable to type 'ReactNode'.
12:20:00.340 app/routes/_authenticated+/admin+/documents._index.tsx(84,38): error TS18046: 'row.original.user' is of type 'unknown'.
12:20:00.340 app/routes/_authenticated+/admin+/documents._index.tsx(85,31): error TS18046: 'row.original.user' is of type 'unknown'.
12:20:00.340 app/routes/_authenticated+/admin+/documents._index.tsx(86,15): error TS18046: 'row.original.user' is of type 'unknown'.
12:20:00.340 app/routes/_authenticated+/admin+/documents._index.tsx(91,43): error TS18046: 'row.original.user' is of type 'unknown'.
12:20:00.340 app/routes/_authenticated+/admin+/documents._index.tsx(108,26): error TS18046: 'row.original.user' is of type 'unknown'.
12:20:00.340 app/routes/_authenticated+/admin+/documents._index.tsx(109,26): error TS18046: 'row.original.user' is of type 'unknown'.
12:20:00.340 app/routes/_authenticated+/admin+/documents._index.tsx(119,38): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string | number | Date | undefined'.
12:20:00.340 app/routes/_authenticated+/admin+/stats.tsx(132,37): error TS2339: Property 'SENT' does not exist on type '{ [x: number]: number; TOTAL_RECIPIENTS: number; }'.
12:20:00.340 app/routes/_authenticated+/admin+/stats.tsx(137,37): error TS2339: Property 'OPENED' does not exist on type '{ [x: number]: number; TOTAL_RECIPIENTS: number; }'.
12:20:00.340 app/routes/_authenticated+/admin+/stats.tsx(142,37): error TS2339: Property 'SIGNED' does not exist on type '{ [x: number]: number; TOTAL_RECIPIENTS: number; }'.
12:20:00.340 app/routes/_authenticated+/dashboard.tsx(39,35): error TS7006: Parameter 'org' implicitly has an 'any' type.
12:20:00.340 app/routes/_authenticated+/dashboard.tsx(40,22): error TS7006: Parameter 'team' implicitly has an 'any' type.
12:20:00.340 app/routes/_authenticated+/dashboard.tsx(104,35): error TS7006: Parameter 'org' implicitly has an 'any' type.
12:20:00.340 app/routes/_authenticated+/dashboard.tsx(183,29): error TS7006: Parameter 'team' implicitly has an 'any' type.
12:20:00.340 app/routes/_authenticated+/o.$orgUrl.\_index.tsx(128,34): error TS7006: Parameter 'team' implicitly has an 'any' type.
12:20:00.340 app/routes/\_authenticated+/o.$orgUrl.settings.billing.tsx(3,10): error TS2305: Module '"@prisma/client"' has no exported member 'SubscriptionStatus'.
12:20:00.340 app/routes/_authenticated+/o.$orgUrl.settings.groups.$id.tsx(7,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationGroupType'.
12:20:00.341 app/routes/_authenticated+/o.$orgUrl.settings.groups.$id.tsx(7,33): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberRole'.
12:20:00.341 app/routes/_authenticated+/o.$orgUrl.settings.groups.$id.tsx(73,17): error TS18046: 'groupData.data' is of type 'unknown'.
12:20:00.341 app/routes/_authenticated+/o.$orgUrl.settings.groups.$id.tsx(73,39): error TS7006: Parameter 'g' implicitly has an 'any' type.
12:20:00.341 app/routes/_authenticated+/o.$orgUrl.settings.groups.$id.tsx(138,50): error TS2537: Type 'unknown' has no matching index signature for type 'number'.
12:20:00.341 app/routes/_authenticated+/o.$orgUrl.settings.groups.$id.tsx(155,37): error TS7006: Parameter 'member' implicitly has an 'any' type.
12:20:00.341 app/routes/_authenticated+/o.$orgUrl.settings.groups.$id.tsx(262,28): error TS18046: 'organisationMembers' is of type 'unknown'.
12:20:00.341 app/routes/_authenticated+/o.$orgUrl.settings.groups.$id.tsx(262,53): error TS7006: Parameter 'member' implicitly has an 'any' type.
12:20:00.341 app/routes/_authenticated+/o.$orgUrl.settings.sso.tsx(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberRole'.
12:20:00.341 app/routes/\_authenticated+/o.$orgUrl.settings.sso.tsx(163,27): error TS18046: 'values.allowedDomains' is of type 'unknown'.
12:20:00.341 app/routes/_authenticated+/settings+/security._index.tsx(50,12): error TS7006: Parameter 'value' implicitly has an 'any' type.
12:20:00.341 app/routes/_authenticated+/settings+/security.sessions.tsx(7,26): error TS7016: Could not find a declaration file for module 'ua-parser-js'. '/vercel/path0/node_modules/ua-parser-js/src/ua-parser.js' implicitly has an 'any' type.
12:20:00.341   Try `npm i --save-dev @types/ua-parser-js` if it exists or add a new declaration (.d.ts) file containing `declare module 'ua-parser-js';`
12:20:00.341 app/routes/_authenticated+/t.$teamUrl+/\_layout.tsx(5,10): error TS2305: Module '"@prisma/client"' has no exported member 'SubscriptionStatus'.
12:20:00.341 app/routes/\_authenticated+/t.$teamUrl+/documents.$id.\_index.tsx(5,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.341 app/routes/\_authenticated+/t.$teamUrl+/documents.$id.\_index.tsx(192,58): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.341 app/routes/\_authenticated+/t.$teamUrl+/documents.$id.\_index.tsx(232,24): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.341 app/routes/\_authenticated+/t.$teamUrl+/documents.$id.\_layout.tsx(3,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.341 app/routes/\_authenticated+/t.$teamUrl+/documents.$id.edit.tsx(5,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.341 app/routes/\_authenticated+/t.$teamUrl+/documents.$id.legacy_editor.tsx(49,49): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.341 app/routes/\_authenticated+/t.$teamUrl+/documents.$id.logs.tsx(5,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.341 app/routes/\_authenticated+/t.$teamUrl+/documents.$id.logs.tsx(5,29): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.341 app/routes/\_authenticated+/t.$teamUrl+/documents.$id.logs.tsx(183,32): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.341 app/routes/\_authenticated+/t.$teamUrl+/documents._index.tsx(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.341 app/routes/_authenticated+/t.$teamUrl+/documents.\_index.tsx(5,10): error TS2305: Module '"@prisma/client"' has no exported member 'FolderType'.
12:20:00.341 app/routes/\_authenticated+/t.$teamUrl+/documents._index.tsx(5,22): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationType'.
12:20:00.341 app/routes/_authenticated+/t.$teamUrl+/documents.\_index.tsx(79,26): error TS2345: Argument of type 'string | number | symbol' is not assignable to parameter of type 'string'.
12:20:00.341 Type 'number' is not assignable to type 'string'.
12:20:00.341 app/routes/\_authenticated+/t.$teamUrl+/settings._index.tsx(100,69): error TS2339: Property 'expiresAt' does not exist on type '{}'.
12:20:00.341 app/routes/_authenticated+/t.$teamUrl+/settings.groups.tsx(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationGroupType'.
12:20:00.341 app/routes/\_authenticated+/t.$teamUrl+/settings.groups.tsx(4,33): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberRole'.
12:20:00.341 app/routes/_authenticated+/t.$teamUrl+/settings.groups.tsx(57,33): error TS18046: 'everyoneGroupQuery.data.data' is of type 'unknown'.
12:20:00.341 app/routes/\_authenticated+/t.$teamUrl+/settings.public-profile.tsx(5,15): error TS2305: Module '"@prisma/client"' has no exported member 'TemplateDirectLink'.
12:20:00.341 app/routes/_authenticated+/t.$teamUrl+/settings.public-profile.tsx(5,35): error TS2305: Module '"@prisma/client"' has no exported member 'TemplateType'.
12:20:00.341 app/routes/\_authenticated+/t.$teamUrl+/settings.public-profile.tsx(86,32): error TS2339: Property 'enabled' does not exist on type '{}'.
12:20:00.342 app/routes/_authenticated+/t.$teamUrl+/settings.tokens.tsx(3,10): error TS2305: Module '"@prisma/client"' has no exported member 'TeamMemberRole'.
12:20:00.342 app/routes/\_authenticated+/t.$teamUrl+/settings.webhooks.$id.\_index.tsx(7,10): error TS2305: Module '"@prisma/client"' has no exported member 'WebhookCallStatus'.
12:20:00.342 app/routes/\_authenticated+/t.$teamUrl+/settings.webhooks.$id.\_index.tsx(7,29): error TS2305: Module '"@prisma/client"' has no exported member 'WebhookTriggerEvents'.
12:20:00.342 app/routes/\_authenticated+/t.$teamUrl+/settings.webhooks.$id.\_index.tsx(179,61): error TS2537: Type 'unknown' has no matching index signature for type 'number'.
12:20:00.342 app/routes/\_authenticated+/t.$teamUrl+/settings.webhooks.$id.\_index.tsx(277,17): error TS2322: Type '{}' is not assignable to type 'string'.
12:20:00.342 app/routes/\_authenticated+/t.$teamUrl+/settings.webhooks.$id.\_index.tsx(300,11): error TS2322: Type 'unknown' is not assignable to type 'any[]'.
12:20:00.342 app/routes/\_authenticated+/t.$teamUrl+/settings.webhooks.$id.\_index.tsx(301,11): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.342 app/routes/\_authenticated+/t.$teamUrl+/settings.webhooks.$id.\_index.tsx(302,11): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.342 app/routes/\_authenticated+/t.$teamUrl+/settings.webhooks.$id.\_index.tsx(303,11): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.342 app/routes/\_authenticated+/t.$teamUrl+/settings.webhooks.$id.\_index.tsx(333,13): error TS18046: 'results.totalPages' is of type 'unknown'.
12:20:00.342 app/routes/\_authenticated+/t.$teamUrl+/settings.webhooks.$id.\_index.tsx(355,39): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string'.
12:20:00.342 app/routes/\_authenticated+/t.$teamUrl+/settings.webhooks.$id.\_index.tsx(387,7): error TS2322: Type '{ label: string; value: unknown; }[]' is not assignable to type 'ComboBoxOption<string>[]'.
12:20:00.342 Type '{ label: string; value: unknown; }' is not assignable to type 'ComboBoxOption<string>'.
12:20:00.342 Types of property 'value' are incompatible.
12:20:00.342 Type 'unknown' is not assignable to type 'string'.
12:20:00.342 app/routes/\_authenticated+/t.$teamUrl+/settings.webhooks._index.tsx(6,15): error TS2305: Module '"@prisma/client"' has no exported member 'Webhook'.
12:20:00.342 app/routes/_authenticated+/t.$teamUrl+/settings.webhooks.\_index.tsx(91,21): error TS7006: Parameter 'event' implicitly has an 'any' type.
12:20:00.342 app/routes/\_authenticated+/t.$teamUrl+/templates.$id.\_index.tsx(5,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSigningOrder'.
12:20:00.342 app/routes/\_authenticated+/t.$teamUrl+/templates.$id.\_index.tsx(5,32): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.342 app/routes/\_authenticated+/t.$teamUrl+/templates.$id.\_index.tsx(92,47): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.342 app/routes/\_authenticated+/t.$teamUrl+/templates.$id.\_index.tsx(94,8): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.342 app/routes/\_authenticated+/t.$teamUrl+/templates.$id.\_index.tsx(209,56): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.342 app/routes/\_authenticated+/t.$teamUrl+/templates.$id.\_layout.tsx(3,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.342 app/routes/\_authenticated+/t.$teamUrl+/templates._index.tsx(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.342 app/routes/_index.tsx(38,35): error TS7006: Parameter 'team' implicitly has an 'any' type.
12:20:00.342 app/routes/_internal+/[__htmltopdf]+/audit-log.tsx(3,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.342 app/routes/_internal+/[__htmltopdf]+/audit-log.tsx(174,41): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.342 app/routes/_internal+/[__htmltopdf]+/certificate.tsx(3,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.342 app/routes/_internal+/[__htmltopdf]+/certificate.tsx(3,24): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.342 app/routes/_internal+/[__htmltopdf]+/certificate.tsx(3,35): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.342 app/routes/_internal+/[__htmltopdf]+/certificate.tsx(8,26): error TS7016: Could not find a declaration file for module 'ua-parser-js'. '/vercel/path0/node_modules/ua-parser-js/src/ua-parser.js' implicitly has an 'any' type.
12:20:00.342   Try `npm i --save-dev @types/ua-parser-js` if it exists or add a new declaration (.d.ts) file containing `declare module 'ua-parser-js';`
12:20:00.343 app/routes/_internal+/[__htmltopdf]+/certificate.tsx(140,49): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.343 app/routes/_internal+/[__htmltopdf]+/certificate.tsx(153,10): error TS7006: Parameter 'log' implicitly has an 'any' type.
12:20:00.343 app/routes/_internal+/[__htmltopdf]+/certificate.tsx(158,61): error TS2339: Property 'at' does not exist on type '(array: IterableContainer) => ReorderedArray<IterableContainer>'.
12:20:00.343 app/routes/_internal+/[__htmltopdf]+/certificate.tsx(185,10): error TS7006: Parameter 'log' implicitly has an 'any' type.
12:20:00.343 app/routes/_internal+/[__htmltopdf]+/certificate.tsx(191,10): error TS7006: Parameter 'log' implicitly has an 'any' type.
12:20:00.345 app/routes/_internal+/[__htmltopdf]+/certificate.tsx(198,10): error TS7006: Parameter 'log' implicitly has an 'any' type.
12:20:00.346 app/routes/_internal+/[__htmltopdf]+/certificate.tsx(205,10): error TS7006: Parameter 'log' implicitly has an 'any' type.
12:20:00.346 app/routes/_internal+/[__htmltopdf]+/certificate.tsx(214,14): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.346 app/routes/_internal+/[__htmltopdf]+/certificate.tsx(216,10): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.346 app/routes/_internal+/[__htmltopdf]+/certificate.tsx(239,41): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.346 app/routes/_internal+/[__htmltopdf]+/certificate.tsx(239,52): error TS7006: Parameter 'i' implicitly has an 'any' type.
12:20:00.346 app/routes/_internal+/[__htmltopdf]+/certificate.tsx(366,39): error TS7053: Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ __OWNER__: MessageDescriptor; }'.
12:20:00.346 app/routes/_profile+/p.$url.tsx(117,49): error TS7006: Parameter 'line' implicitly has an 'any' type.
12:20:00.346 app/routes/\_profile+/p.$url.tsx(117,55): error TS7006: Parameter 'index' implicitly has an 'any' type.
12:20:00.346 app/routes/_recipient+/d.$token+/\_index.tsx(46,6): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.346 app/routes/\_recipient+/d.$token+/_index.tsx(232,19): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.346 app/routes/_recipient+/d.$token+/\_index.tsx(245,30): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.346 app/routes/\_recipient+/d.$token+/_index.tsx(246,9): error TS2322: Type 'unknown' is not assignable to type 'SigningAuthRecipient'.
12:20:00.346 app/routes/_recipient+/d.$token+/\_index.tsx(249,33): error TS2322: Type 'unknown' is not assignable to type 'Pick<any, "type" | "status" | "envelopeItems">'.
12:20:00.346 app/routes/\_recipient+/d.$token+/_index.tsx(249,60): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.346 app/routes/_recipient+/sign.$token+/\_index.tsx(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSigningOrder'.
12:20:00.346 app/routes/\_recipient+/sign.$token+/_index.tsx(2,32): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.346 app/routes/_recipient+/sign.$token+/\_index.tsx(2,48): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.346 app/routes/\_recipient+/sign.$token+/_index.tsx(2,63): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.346 app/routes/_recipient+/sign.$token+/\_index.tsx(211,19): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.346 app/routes/\_recipient+/sign.$token+/_index.tsx(212,20): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.346 app/routes/_recipient+/sign.$token+/\_index.tsx(217,70): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.346 app/routes/\_recipient+/sign.$token+/_index.tsx(225,57): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.348 app/routes/_recipient+/sign.$token+/\_index.tsx(231,23): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.348 app/routes/\_recipient+/sign.$token+/_index.tsx(247,20): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.348 app/routes/_recipient+/sign.$token+/\_index.tsx(434,7): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.348 app/routes/\_recipient+/sign.$token+/_index.tsx(434,29): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.348 app/routes/_recipient+/sign.$token+/\_index.tsx(438,17): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.348 app/routes/\_recipient+/sign.$token+/_index.tsx(439,11): error TS2322: Type '{} | undefined' is not assignable to type 'Pick<Signature, "signatureImageAsBase64" | "typedSignature"> | undefined'.
12:20:00.348   Type '{}' is missing the following properties from type 'Pick<Signature, "signatureImageAsBase64" | "typedSignature">': signatureImageAsBase64, typedSignature
12:20:00.348 app/routes/_recipient+/sign.$token+/\_index.tsx(453,48): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.348 app/routes/\_recipient+/sign.$token+/_index.tsx(488,14): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.348 app/routes/_recipient+/sign.$token+/\_index.tsx(489,33): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.348 app/routes/\_recipient+/sign.$token+/_index.tsx(489,64): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.348 app/routes/_recipient+/sign.$token+/\_index.tsx(490,34): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.348 app/routes/\_recipient+/sign.$token+/_index.tsx(493,30): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.348 app/routes/_recipient+/sign.$token+/\_index.tsx(494,9): error TS2322: Type 'unknown' is not assignable to type 'SigningAuthRecipient'.
12:20:00.348 app/routes/\_recipient+/sign.$token+/_index.tsx(497,33): error TS2322: Type 'unknown' is not assignable to type 'Pick<any, "type" | "status" | "envelopeItems">'.
12:20:00.349 app/routes/_recipient+/sign.$token+/\_index.tsx(497,60): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.349 app/routes/\_recipient+/sign.$token+/complete.tsx(3,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.349 app/routes/_recipient+/sign.$token+/complete.tsx(3,26): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.350 app/routes/\_recipient+/sign.$token+/complete.tsx(3,37): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.350 app/routes/_recipient+/sign.$token+/complete.tsx(80,18): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.350 app/routes/\_recipient+/sign.$token+/rejected.tsx(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.351 app/routes/_recipient+/sign.$token+/rejected.tsx(58,18): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.351 app/routes/\_recipient+/sign.$token+/waiting.tsx(2,15): error TS2305: Module '"@prisma/client"' has no exported member 'Team'.
12:20:00.351 app/routes/_recipient+/sign.$token+/waiting.tsx(3,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.351 app/routes/\_recipient+/sign.$token+/waiting.tsx(3,26): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.351 app/routes/_share+/share.$slug.opengraph.tsx(56,41): error TS2339: Property 'signatureImageAsBase64' does not exist on type '{}'.
12:20:00.351 app/routes/\_share+/share.$slug.opengraph.tsx(64,24): error TS2339: Property 'name' does not exist on type '{ signatures: unknown[]; }'.
12:20:00.351 app/routes/_share+/share.$slug.opengraph.tsx(64,42): error TS2339: Property 'email' does not exist on type '{ signatures: unknown[]; }'.
12:20:00.351 app/routes/\_unauthenticated+/o.$orgUrl.signin.tsx(84,61): error TS7006: Parameter 'member' implicitly has an 'any' type.
12:20:00.351 app/routes/_unauthenticated+/organisation.decline.$token.tsx(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberInviteStatus'.
12:20:00.351 app/routes/embed+/\_v0+/direct.$token.tsx(90,6): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.351 app/routes/embed+/_v0+/direct.$token.tsx(97,42): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.351 app/routes/embed+/\_v0+/direct.$token.tsx(159,74): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.351 app/routes/embed+/_v0+/direct.$token.tsx(176,19): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.351 app/routes/embed+/\_v0+/direct.$token.tsx(177,20): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.351 app/routes/embed+/_v0+/direct.$token.tsx(182,70): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.351 app/routes/embed+/\_v0+/direct.$token.tsx(191,31): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.351 app/routes/embed+/_v0+/direct.$token.tsx(318,30): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.351 app/routes/embed+/\_v0+/direct.$token.tsx(319,9): error TS2322: Type 'unknown' is not assignable to type 'SigningAuthRecipient'.
12:20:00.351 app/routes/embed+/_v0+/direct.$token.tsx(323,33): error TS2322: Type 'unknown' is not assignable to type 'Pick<any, "type" | "status" | "envelopeItems">'.
12:20:00.351 app/routes/embed+/\_v0+/direct.$token.tsx(323,60): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.351 app/routes/embed+/_v0+/sign.$token.tsx(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.351 app/routes/embed+/\_v0+/sign.$token.tsx(195,74): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.351 app/routes/embed+/_v0+/sign.$token.tsx(223,19): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.351 app/routes/embed+/\_v0+/sign.$token.tsx(224,20): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.351 app/routes/embed+/_v0+/sign.$token.tsx(229,70): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.351 app/routes/embed+/\_v0+/sign.$token.tsx(238,31): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.351 app/routes/embed+/_v0+/sign.$token.tsx(376,14): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.351 app/routes/embed+/\_v0+/sign.$token.tsx(377,33): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.351 app/routes/embed+/_v0+/sign.$token.tsx(377,64): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.351 app/routes/embed+/\_v0+/sign.$token.tsx(378,34): error TS18046: 'recipient' is of type 'unknown'.
12:20:00.352 app/routes/embed+/_v0+/sign.$token.tsx(381,30): error TS18046: 'envelope' is of type 'unknown'.
12:20:00.352 app/routes/embed+/\_v0+/sign.$token.tsx(382,9): error TS2322: Type 'unknown' is not assignable to type 'SigningAuthRecipient'.
12:20:00.352 app/routes/embed+/_v0+/sign.$token.tsx(385,33): error TS2322: Type 'unknown' is not assignable to type 'Pick<any, "type" | "status" | "envelopeItems">'.
12:20:00.352 app/routes/embed+/v1+/authoring+/document.create.tsx(77,9): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.352 app/routes/embed+/v1+/authoring+/document.create.tsx(81,28): error TS2339: Property 'length' does not exist on type '{}'.
12:20:00.352 app/routes/embed+/v1+/authoring+/document.create.tsx(81,59): error TS2339: Property 'includes' does not exist on type '{}'.
12:20:00.352 app/routes/embed+/v1+/authoring+/document.create.tsx(83,28): error TS2339: Property 'length' does not exist on type '{}'.
12:20:00.352 app/routes/embed+/v1+/authoring+/document.create.tsx(83,59): error TS2339: Property 'includes' does not exist on type '{}'.
12:20:00.352 app/routes/embed+/v1+/authoring+/document.create.tsx(85,28): error TS2339: Property 'length' does not exist on type '{}'.
12:20:00.352 app/routes/embed+/v1+/authoring+/document.create.tsx(85,59): error TS2339: Property 'includes' does not exist on type '{}'.
12:20:00.352 app/routes/embed+/v1+/authoring+/document.edit.$id.tsx(5,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentDistributionMethod'.
12:20:00.352 app/routes/embed+/v1+/authoring+/document.edit.$id.tsx(5,38): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSigningOrder'.
12:20:00.352 app/routes/embed+/v1+/authoring+/document.edit.$id.tsx(5,60): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.352 app/routes/embed+/v1+/authoring+/document.edit.$id.tsx(71,39): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.352 app/routes/embed+/v1+/authoring+/document.edit.$id.tsx(135,39): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.352 app/routes/embed+/v1+/authoring+/document.edit.$id.tsx(147,34): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.352 app/routes/embed+/v1+/authoring+/document.edit.$id.tsx(152,35): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.352 app/routes/embed+/v1+/authoring+/document.edit.$id.tsx(183,74): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string'.
12:20:00.352 app/routes/embed+/v1+/authoring+/document.edit.$id.tsx(216,9): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.352 app/routes/embed+/v1+/authoring+/document.edit.$id.tsx(220,49): error TS2339: Property 'length' does not exist on type '{}'.
12:20:00.352 app/routes/embed+/v1+/authoring+/document.edit.$id.tsx(221,49): error TS2339: Property 'includes' does not exist on type '{}'.
12:20:00.352 app/routes/embed+/v1+/authoring+/document.edit.$id.tsx(224,49): error TS2339: Property 'length' does not exist on type '{}'.
12:20:00.352 app/routes/embed+/v1+/authoring+/document.edit.$id.tsx(225,49): error TS2339: Property 'includes' does not exist on type '{}'.
12:20:00.352 app/routes/embed+/v1+/authoring+/document.edit.$id.tsx(228,49): error TS2339: Property 'length' does not exist on type '{}'.
12:20:00.352 app/routes/embed+/v1+/authoring+/document.edit.$id.tsx(229,49): error TS2339: Property 'includes' does not exist on type '{}'.
12:20:00.352 app/routes/embed+/v1+/authoring+/template.edit.$id.tsx(5,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentDistributionMethod'.
12:20:00.352 app/routes/embed+/v1+/authoring+/template.edit.$id.tsx(5,38): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSigningOrder'.
12:20:00.352 app/routes/embed+/v1+/authoring+/template.edit.$id.tsx(5,60): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.353 app/routes/embed+/v1+/authoring+/template.edit.$id.tsx(71,39): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.353 app/routes/embed+/v1+/authoring+/template.edit.$id.tsx(135,39): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.353 app/routes/embed+/v1+/authoring+/template.edit.$id.tsx(147,34): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.353 app/routes/embed+/v1+/authoring+/template.edit.$id.tsx(152,35): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.353 app/routes/embed+/v1+/authoring+/template.edit.$id.tsx(183,74): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string'.
12:20:00.353 app/routes/embed+/v1+/authoring+/template.edit.$id.tsx(215,9): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.353 app/routes/embed+/v1+/authoring+/template.edit.$id.tsx(219,49): error TS2339: Property 'length' does not exist on type '{}'.
12:20:00.353 app/routes/embed+/v1+/authoring+/template.edit.$id.tsx(220,49): error TS2339: Property 'includes' does not exist on type '{}'.
12:20:00.353 app/routes/embed+/v1+/authoring+/template.edit.$id.tsx(223,49): error TS2339: Property 'length' does not exist on type '{}'.
12:20:00.353 app/routes/embed+/v1+/authoring+/template.edit.$id.tsx(224,49): error TS2339: Property 'includes' does not exist on type '{}'.
12:20:00.353 app/routes/embed+/v1+/authoring+/template.edit.$id.tsx(227,49): error TS2339: Property 'length' does not exist on type '{}'.
12:20:00.353 app/routes/embed+/v1+/authoring+/template.edit.$id.tsx(228,49): error TS2339: Property 'includes' does not exist on type '{}'.
12:20:00.353 app/routes/embed+/v1+/multisign+/\_index.tsx(3,10): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.353 app/utils/field-signing/checkbox-field.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.353 app/utils/field-signing/checkbox-field.ts(33,33): error TS7006: Parameter '\_value' implicitly has an 'any' type.
12:20:00.353 app/utils/field-signing/checkbox-field.ts(33,41): error TS7006: Parameter 'i' implicitly has an 'any' type.
12:20:00.353 app/utils/field-signing/checkbox-field.ts(46,58): error TS7006: Parameter 'v' implicitly has an 'any' type.
12:20:00.353 app/utils/field-signing/checkbox-field.ts(46,82): error TS7006: Parameter 'v' implicitly has an 'any' type.
12:20:00.353 app/utils/field-signing/checkbox-field.ts(48,7): error TS18047: 'checkedValues' is possibly 'null'.
12:20:00.353 app/utils/field-signing/checkbox-field.ts(49,5): error TS2322: Type '{ type: any; value: never[]; }' is not assignable to type 'null'.
12:20:00.353 app/utils/field-signing/checkbox-field.ts(72,7): error TS2322: Type '{ type: any; value: number[]; }' is not assignable to type 'null'.
12:20:00.353 app/utils/field-signing/checkbox-field.ts(79,7): error TS18047: 'checkedValues' is possibly 'null'.
12:20:00.353 app/utils/field-signing/checkbox-field.ts(90,9): error TS2322: Type 'number[] | null' is not assignable to type 'number[]'.
12:20:00.353 Type 'null' is not assignable to type 'number[]'.
12:20:00.353 app/utils/field-signing/checkbox-field.ts(99,3): error TS2322: Type '{ type: any; value: number[]; }' is not assignable to type 'null'.
12:20:00.353 app/utils/field-signing/dropdown-field.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.353 app/utils/field-signing/dropdown-field.ts(26,5): error TS2322: Type '{ type: any; value: null; }' is not assignable to type 'null'.
12:20:00.353 app/utils/field-signing/dropdown-field.ts(44,3): error TS2322: Type '{ type: any; value: string; }' is not assignable to type 'null'.
12:20:00.353 app/utils/field-signing/email-field.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.353 app/utils/field-signing/email-field.ts(27,5): error TS2322: Type '{ type: any; value: null; }' is not assignable to type 'null'.
12:20:00.353 app/utils/field-signing/email-field.ts(45,3): error TS2322: Type '{ type: any; value: string; }' is not assignable to type 'null'.
12:20:00.353 app/utils/field-signing/initial-field.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.354 app/utils/field-signing/initial-field.ts(26,5): error TS2322: Type '{ type: any; value: null; }' is not assignable to type 'null'.
12:20:00.354 app/utils/field-signing/initial-field.ts(42,3): error TS2322: Type '{ type: any; value: string | null; }' is not assignable to type 'null'.
12:20:00.354 app/utils/field-signing/name-field.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.354 app/utils/field-signing/name-field.ts(26,5): error TS2322: Type '{ type: any; value: null; }' is not assignable to type 'null'.
12:20:00.354 app/utils/field-signing/name-field.ts(44,3): error TS2322: Type '{ type: any; value: string; }' is not assignable to type 'null'.
12:20:00.354 app/utils/field-signing/number-field.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.354 app/utils/field-signing/number-field.ts(26,5): error TS2322: Type '{ type: any; value: null; }' is not assignable to type 'null'.
12:20:00.354 app/utils/field-signing/number-field.ts(44,3): error TS2322: Type '{ type: any; value: string; }' is not assignable to type 'null'.
12:20:00.354 app/utils/field-signing/signature-field.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.354 app/utils/field-signing/signature-field.ts(30,5): error TS2322: Type '{ type: any; value: null; }' is not assignable to type 'null'.
12:20:00.354 app/utils/field-signing/signature-field.ts(50,3): error TS2322: Type '{ type: any; value: string; }' is not assignable to type 'null'.
12:20:00.354 app/utils/field-signing/text-field.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.354 app/utils/field-signing/text-field.ts(26,5): error TS2322: Type '{ type: any; value: null; }' is not assignable to type 'null'.
12:20:00.354 app/utils/field-signing/text-field.ts(44,3): error TS2322: Type '{ type: any; value: string; }' is not assignable to type 'null'.
12:20:00.354 server/api/download/download.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.354 server/api/files/files.helpers.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentDataType'.
12:20:00.354 server/api/files/files.helpers.ts(1,33): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.354 server/api/files/files.helpers.ts(2,32): error TS7016: Could not find a declaration file for module 'content-disposition'. '/vercel/path0/node_modules/content-disposition/index.js' implicitly has an 'any' type.
12:20:00.354 Try `npm i --save-dev @types/content-disposition` if it exists or add a new declaration (.d.ts) file containing `declare module 'content-disposition';`
12:20:00.354 server/api/files/files.ts(224,38): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'EnvelopeItemWhereUniqueInput'.
12:20:00.354 server/api/files/files.ts(276,38): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'EnvelopeItemWhereUniqueInput'.
12:20:00.354 server/api/files/files.types.ts(3,32): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/DocumentDataSchema' or its corresponding type declarations.
12:20:00.354 ../../packages/api/v1/implementation.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentDataType'.
12:20:00.354 ../../packages/api/v1/implementation.ts(1,28): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.354 ../../packages/api/v1/implementation.ts(1,42): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.354 ../../packages/api/v1/implementation.ts(75,35): error TS7006: Parameter 'document' implicitly has an 'any' type.
12:20:00.364 ../../packages/api/v1/implementation.ts(139,44): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.364 ../../packages/api/v1/implementation.ts(172,39): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.364 ../../packages/api/v1/implementation.ts(458,9): error TS2322: Type '{ [x: string]: any; name?: unknown; email?: unknown; role?: unknown; signingOrder?: unknown; }[]' is not assignable to type 'RecipientData[]'.
12:20:00.364 Type '{ [x: string]: any; name?: unknown; email?: unknown; role?: unknown; signingOrder?: unknown; }' is not assignable to type 'RecipientData'.
12:20:00.364 Types of property 'email' are incompatible.
12:20:00.364 Type 'unknown' is not assignable to type 'string'.
12:20:00.364 ../../packages/api/v1/implementation.ts(514,32): error TS2339: Property 'dateFormat' does not exist on type '{}'.
12:20:00.365 ../../packages/api/v1/implementation.ts(515,64): error TS2339: Property 'dateFormat' does not exist on type '{}'.
12:20:00.365 ../../packages/api/v1/implementation.ts(518,17): error TS2339: Property 'dateFormat' does not exist on type '{}'.
12:20:00.365 ../../packages/api/v1/implementation.ts(527,30): error TS2339: Property 'timezone' does not exist on type '{}'.
12:20:00.365 ../../packages/api/v1/implementation.ts(528,48): error TS2339: Property 'timezone' does not exist on type '{}'.
12:20:00.365 ../../packages/api/v1/implementation.ts(531,37): error TS2339: Property 'timezone' does not exist on type '{}'.
12:20:00.365 ../../packages/api/v1/implementation.ts(542,31): error TS2339: Property 'endsWith' does not exist on type '{}'.
12:20:00.365 ../../packages/api/v1/implementation.ts(544,52): error TS2345: Argument of type '{}' is not assignable to parameter of type 'string'.
12:20:00.365 ../../packages/api/v1/implementation.ts(563,11): error TS2322: Type 'unknown' is not assignable to type 'string'.
12:20:00.365 ../../packages/api/v1/implementation.ts(564,11): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.365 ../../packages/api/v1/implementation.ts(565,11): error TS2322: Type '{} | undefined' is not assignable to type 'string | undefined'.
12:20:00.365 Type '{}' is not assignable to type 'string'.
12:20:00.365 ../../packages/api/v1/implementation.ts(567,11): error TS2322: Type 'unknown' is not assignable to type '("ACCOUNT" | "TWO_FACTOR_AUTH")[] | undefined'.
12:20:00.365 ../../packages/api/v1/implementation.ts(568,11): error TS2322: Type 'unknown' is not assignable to type '("ACCOUNT" | "PASSKEY" | "TWO_FACTOR_AUTH" | "PASSWORD")[] | undefined'.
12:20:00.365 ../../packages/api/v1/implementation.ts(569,11): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.365 ../../packages/api/v1/implementation.ts(570,11): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.365 ../../packages/api/v1/implementation.ts(572,9): error TS2322: Type 'unknown' is not assignable to type 'Partial<Omit<DocumentMeta, "id">> | undefined'.
12:20:00.365 ../../packages/api/v1/implementation.ts(573,9): error TS2322: Type 'unknown' is not assignable to type '{ label: string; data: string; type?: "link" | undefined; }[] | undefined'.
12:20:00.365 ../../packages/api/v1/implementation.ts(676,39): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.366 ../../packages/api/v1/implementation.ts(703,37): error TS7006: Parameter 'template' implicitly has an 'any' type.
12:20:00.366 ../../packages/api/v1/implementation.ts(713,41): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.366 ../../packages/api/v1/implementation.ts(793,9): error TS2322: Type '{ id: any; name: unknown; email: unknown; signingOrder: unknown; role: unknown; }[]' is not assignable to type '{ id: number; name?: string | undefined; email: string; signingOrder?: number | null | undefined; }[]'.
12:20:00.366 Type '{ id: any; name: unknown; email: unknown; signingOrder: unknown; role: unknown; }' is not assignable to type '{ id: number; name?: string | undefined; email: string; signingOrder?: number | null | undefined; }'.
12:20:00.366 Types of property 'name' are incompatible.
12:20:00.366 Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.366 ../../packages/api/v1/implementation.ts(794,9): error TS2322: Type '{ title: string; subject?: unknown; message?: unknown; timezone?: unknown; dateFormat?: unknown; redirectUrl?: unknown; signingOrder?: unknown; allowDictateNextSigner?: unknown; language?: unknown; }' is not assignable to type '{ title?: string | undefined; subject?: string | undefined; message?: string | undefined; timezone?: string | undefined; password?: string | undefined; dateFormat?: string | undefined; ... 8 more ...; drawSignatureEnabled?: boolean | undefined; }'.
12:20:00.366 Types of property 'subject' are incompatible.
12:20:00.367 Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.367 ../../packages/api/v1/implementation.ts(858,55): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.367 ../../packages/api/v1/implementation.ts(910,11): error TS2322: Type '{ subject?: unknown; message?: unknown; timezone?: unknown; dateFormat?: unknown; redirectUrl?: unknown; signingOrder?: unknown; allowDictateNextSigner?: unknown; language?: unknown; distributionMethod?: unknown; typedSignatureEnabled?: unknown; uploadSignatureEnabled?: unknown; drawSignatureEnabled?: unknown; email...' is not assignable to type '{ title?: string | undefined; subject?: string | undefined; message?: string | undefined; timezone?: string | undefined; password?: string | undefined; dateFormat?: string | undefined; ... 8 more ...; drawSignatureEnabled?: boolean | undefined; }'.
12:20:00.367 Types of property 'subject' are incompatible.
12:20:00.367 Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.378 ../../packages/api/v1/implementation.ts(986,48): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.378 ../../packages/api/v1/implementation.ts(1085,39): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.378 ../../packages/api/v1/implementation.ts(1185,53): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.378 ../../packages/api/v1/implementation.ts(1205,30): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.378 ../../packages/api/v1/implementation.ts(1217,38): error TS2339: Property 'actionAuth' does not exist on type '{}'.
12:20:00.378 ../../packages/api/v1/implementation.ts(1298,11): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.378 ../../packages/api/v1/implementation.ts(1299,11): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.378 ../../packages/api/v1/implementation.ts(1301,11): error TS2322: Type 'unknown' is not assignable to type 'number | null | undefined'.
12:20:00.378 ../../packages/api/v1/implementation.ts(1302,36): error TS2339: Property 'actionAuth' does not exist on type '{}'.
12:20:00.378 ../../packages/api/v1/implementation.ts(1423,62): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.378 ../../packages/api/v1/implementation.ts(1437,17): error TS18046: 'pageNumber' is of type 'unknown'.
12:20:00.378 ../../packages/api/v1/implementation.ts(1457,15): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string'.
12:20:00.378 ../../packages/api/v1/implementation.ts(1466,40): error TS2339: Property 'type' does not exist on type '{}'.
12:20:00.378 ../../packages/api/v1/implementation.ts(1485,16): error TS2349: This expression is not callable.
12:20:00.378 Type 'NonExhaustiveError<unknown>' has no call signatures.
12:20:00.378 ../../packages/api/v1/implementation.ts(1523,19): error TS2322: Type 'unknown' is not assignable to type 'number'.
12:20:00.378 ../../packages/api/v1/implementation.ts(1648,11): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.378 ../../packages/api/v1/implementation.ts(1649,11): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.379 ../../packages/api/v1/implementation.ts(1650,11): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.379 ../../packages/api/v1/implementation.ts(1651,11): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.379 ../../packages/api/v1/implementation.ts(1652,11): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.379 ../../packages/api/v1/middleware/authenticated.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'Team'.
12:20:00.379 ../../packages/api/v1/middleware/authenticated.ts(1,21): error TS2305: Module '"@prisma/client"' has no exported member 'User'.
12:20:00.379 ../../packages/api/v1/schema.ts(3,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentDataType'.
12:20:00.379 ../../packages/api/v1/schema.ts(4,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentDistributionMethod'.
12:20:00.379 ../../packages/api/v1/schema.ts(5,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSigningOrder'.
12:20:00.379 ../../packages/api/v1/schema.ts(6,3): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.379 ../../packages/api/v1/schema.ts(7,3): error TS2305: Module '"@prisma/client"' has no exported member 'ReadStatus'.
12:20:00.379 ../../packages/api/v1/schema.ts(8,3): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.379 ../../packages/api/v1/schema.ts(9,3): error TS2305: Module '"@prisma/client"' has no exported member 'SendStatus'.
12:20:00.379 ../../packages/api/v1/schema.ts(10,3): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.379 ../../packages/api/v1/schema.ts(12,10): error TS2305: Module '"@prisma/client"' has no exported member 'TemplateType'.
12:20:00.379 ../../packages/auth/server/lib/session/session.ts(3,15): error TS2305: Module '"@prisma/client"' has no exported member 'Session'.
12:20:00.379 ../../packages/auth/server/lib/session/session.ts(3,29): error TS2305: Module '"@prisma/client"' has no exported member 'User'.
12:20:00.379 ../../packages/auth/server/lib/session/session.ts(3,35): error TS2305: Module '"@prisma/client"' has no exported member 'UserSecurityAuditLogType'.
12:20:00.379 ../../packages/auth/server/lib/session/session.ts(150,36): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.379 ../../packages/auth/server/lib/utils/delete-account-provider.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'UserSecurityAuditLogType'.
12:20:00.379 ../../packages/auth/server/lib/utils/delete-account-provider.ts(14,36): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.379 ../../packages/auth/server/lib/utils/get-session.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'Session'.
12:20:00.379 ../../packages/auth/server/lib/utils/handle-oauth-callback-url.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'UserSecurityAuditLogType'.
12:20:00.379 ../../packages/auth/server/lib/utils/handle-oauth-callback-url.ts(63,38): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.379 ../../packages/auth/server/lib/utils/handle-oauth-callback-url.ts(109,56): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.379 ../../packages/auth/server/lib/utils/handle-oauth-organisation-callback-url.ts(39,58): error TS7006: Parameter 'domain' implicitly has an 'any' type.
12:20:00.379 ../../packages/auth/server/routes/email-password.ts(3,10): error TS2305: Module '"@prisma/client"' has no exported member 'UserSecurityAuditLogType'.
12:20:00.379 ../../packages/auth/server/routes/email-password.ts(195,14): error TS7006: Parameter 'sessions' implicitly has an 'any' type.
12:20:00.379 ../../packages/auth/server/routes/email-password.ts(195,41): error TS7006: Parameter 's' implicitly has an 'any' type.
12:20:00.379 ../../packages/auth/server/routes/email-password.ts(274,14): error TS7006: Parameter 'sessions' implicitly has an 'any' type.
12:20:00.379 ../../packages/auth/server/routes/email-password.ts(274,41): error TS7006: Parameter 'session' implicitly has an 'any' type.
12:20:00.379 ../../packages/auth/server/routes/passkey.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'UserSecurityAuditLogType'.
12:20:00.379 ../../packages/auth/server/routes/sign-out.ts(73,14): error TS7006: Parameter 'sessions' implicitly has an 'any' type.
12:20:00.379 ../../packages/auth/server/routes/sign-out.ts(73,41): error TS7006: Parameter 'session' implicitly has an 'any' type.
12:20:00.379 ../../packages/auth/server/sso/services/sso-service.ts(324,40): error TS7006: Parameter 'config' implicitly has an 'any' type.
12:20:00.379 ../../packages/auth/server/sso/services/sso-service.ts(331,44): error TS7006: Parameter 'config' implicitly has an 'any' type.
12:20:00.379 ../../packages/auth/server/sso/services/sso-service.ts(477,60): error TS7006: Parameter 'config' implicitly has an 'any' type.
12:20:00.379 ../../packages/ee/server-only/lib/create-email-domain.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'EmailDomainStatus'.
12:20:00.379 ../../packages/ee/server-only/lib/create-email-domain.ts(114,56): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.379 ../../packages/ee/server-only/lib/link-organisation-account.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'UserSecurityAuditLogType'.
12:20:00.379 ../../packages/ee/server-only/lib/link-organisation-account.ts(97,6): error TS7006: Parameter 'account' implicitly has an 'any' type.
12:20:00.379 ../../packages/ee/server-only/lib/link-organisation-account.ts(107,12): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.379 ../../packages/ee/server-only/lib/verify-email-domain.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'EmailDomainStatus'.
12:20:00.379 ../../packages/ee/server-only/limits/server.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSource'.
12:20:00.379 ../../packages/ee/server-only/limits/server.ts(1,26): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.379 ../../packages/ee/server-only/limits/server.ts(1,40): error TS2305: Module '"@prisma/client"' has no exported member 'SubscriptionStatus'.
12:20:00.379 ../../packages/ee/server-only/stripe/update-subscription-item-quantity.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationClaim'.
12:20:00.379 ../../packages/ee/server-only/stripe/update-subscription-item-quantity.ts(1,34): error TS2305: Module '"@prisma/client"' has no exported member 'Subscription'.
12:20:00.380 ../../packages/ee/server-only/stripe/webhook/on-subscription-created.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationType'.
12:20:00.380 ../../packages/ee/server-only/stripe/webhook/on-subscription-created.ts(1,28): error TS2305: Module '"@prisma/client"' has no exported member 'SubscriptionStatus'.
12:20:00.380 ../../packages/ee/server-only/stripe/webhook/on-subscription-deleted.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'SubscriptionStatus'.
12:20:00.380 ../../packages/ee/server-only/stripe/webhook/on-subscription-updated.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationType'.
12:20:00.380 ../../packages/ee/server-only/stripe/webhook/on-subscription-updated.ts(1,28): error TS2305: Module '"@prisma/client"' has no exported member 'SubscriptionStatus'.
12:20:00.380 ../../packages/ee/server-only/stripe/webhook/on-subscription-updated.ts(116,36): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.380 ../../packages/email/mailer.ts(1,34): error TS7016: Could not find a declaration file for module 'nodemailer'. '/vercel/path0/node_modules/nodemailer/lib/nodemailer.js' implicitly has an 'any' type.
12:20:00.380 Try `npm i --save-dev @types/nodemailer` if it exists or add a new declaration (.d.ts) file containing `declare module 'nodemailer';`
12:20:00.380 ../../packages/email/mailer.ts(2,33): error TS7016: Could not find a declaration file for module 'nodemailer'. '/vercel/path0/node_modules/nodemailer/lib/nodemailer.js' implicitly has an 'any' type.
12:20:00.380 Try `npm i --save-dev @types/nodemailer` if it exists or add a new declaration (.d.ts) file containing `declare module 'nodemailer';`
12:20:00.380 ../../packages/email/template-components/template-document-invite.tsx(3,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationType'.
12:20:00.380 ../../packages/email/template-components/template-document-invite.tsx(3,28): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.380 ../../packages/email/templates/document-created-from-direct-template.tsx(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.380 ../../packages/email/templates/document-invite.tsx(4,15): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.380 ../../packages/email/templates/document-invite.tsx(5,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationType'.
12:20:00.380 ../../packages/email/transports/mailchannels.ts(1,49): error TS7016: Could not find a declaration file for module 'nodemailer'. '/vercel/path0/node_modules/nodemailer/lib/nodemailer.js' implicitly has an 'any' type.
12:20:00.380 Try `npm i --save-dev @types/nodemailer` if it exists or add a new declaration (.d.ts) file containing `declare module 'nodemailer';`
12:20:00.380 ../../packages/email/transports/mailchannels.ts(2,30): error TS7016: Could not find a declaration file for module 'nodemailer/lib/mailer'. '/vercel/path0/node_modules/nodemailer/lib/mailer/index.js' implicitly has an 'any' type.
12:20:00.380 Try `npm i --save-dev @types/nodemailer` if it exists or add a new declaration (.d.ts) file containing `declare module 'nodemailer/lib/mailer';`
12:20:00.380 ../../packages/email/transports/mailchannels.ts(3,30): error TS7016: Could not find a declaration file for module 'nodemailer/lib/mailer/mail-message'. '/vercel/path0/node_modules/nodemailer/lib/mailer/mail-message.js' implicitly has an 'any' type.
12:20:00.380 Try `npm i --save-dev @types/nodemailer` if it exists or add a new declaration (.d.ts) file containing `declare module 'nodemailer/lib/mailer/mail-message';`
12:20:00.380 ../../packages/lib/client-only/download-pdf.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeItem'.
12:20:00.382 ../../packages/lib/client-only/hooks/use-editor-fields.ts(4,15): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.382 ../../packages/lib/client-only/hooks/use-editor-fields.ts(4,22): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.382 ../../packages/lib/client-only/hooks/use-editor-fields.ts(5,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.382 ../../packages/lib/client-only/hooks/use-editor-fields.ts(79,8): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.382 ../../packages/lib/client-only/hooks/use-editor-fields.ts(127,8): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.382 ../../packages/lib/client-only/hooks/use-editor-fields.ts(139,28): error TS2345: Argument of type '{} | null' is not assignable to parameter of type 'SetStateAction<string | null>'.
12:20:00.382 Type '{}' is not assignable to type 'SetStateAction<string | null>'.
12:20:00.382 ../../packages/lib/client-only/hooks/use-editor-fields.ts(152,24): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string | null'.
12:20:00.382 ../../packages/lib/client-only/hooks/use-editor-fields.ts(212,20): error TS18046: 'field.positionX' is of type 'unknown'.
12:20:00.382 ../../packages/lib/client-only/hooks/use-editor-fields.ts(213,20): error TS18046: 'field.positionY' is of type 'unknown'.
12:20:00.382 ../../packages/lib/client-only/hooks/use-editor-fields.ts(267,38): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.382 ../../packages/lib/client-only/hooks/use-editor-fields.ts(279,28): error TS2345: Argument of type '{} | null' is not assignable to parameter of type 'SetStateAction<string | null>'.
12:20:00.385 Type '{}' is not assignable to type 'SetStateAction<string | null>'.
12:20:00.385 ../../packages/lib/client-only/hooks/use-editor-fields.ts(283,54): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.385 ../../packages/lib/client-only/hooks/use-editor-fields.ts(324,42): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'number'.
12:20:00.385 ../../packages/lib/client-only/hooks/use-editor-fields.ts(325,42): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'number'.
12:20:00.385 ../../packages/lib/client-only/hooks/use-editor-fields.ts(326,38): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'number'.
12:20:00.385 ../../packages/lib/client-only/hooks/use-editor-fields.ts(327,39): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'number'.
12:20:00.385 ../../packages/lib/client-only/hooks/use-field-page-coords.ts(3,15): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.385 ../../packages/lib/client-only/providers/envelope-editor-provider.tsx(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.385 ../../packages/lib/client-only/providers/envelope-editor-provider.tsx(136,20): error TS7006: Parameter 'prev' implicitly has an 'any' type.
12:20:00.385 ../../packages/lib/client-only/providers/envelope-editor-provider.tsx(159,20): error TS7006: Parameter 'prev' implicitly has an 'any' type.
12:20:00.385 ../../packages/lib/client-only/providers/envelope-editor-provider.tsx(162,37): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.385 ../../packages/lib/client-only/providers/envelope-editor-provider.tsx(163,11): error TS18046: 'recipients' is of type 'unknown'.
12:20:00.385 ../../packages/lib/client-only/providers/envelope-editor-provider.tsx(163,28): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.385 ../../packages/lib/client-only/providers/envelope-editor-provider.tsx(169,33): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.385 ../../packages/lib/client-only/providers/envelope-editor-provider.tsx(170,11): error TS18046: 'recipients' is of type 'unknown'.
12:20:00.385 ../../packages/lib/client-only/providers/envelope-editor-provider.tsx(170,28): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.386 ../../packages/lib/client-only/providers/envelope-editor-provider.tsx(214,5): error TS18046: 'envelopeFields.data' is of type 'unknown'.
12:20:00.386 ../../packages/lib/client-only/providers/envelope-editor-provider.tsx(214,34): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.386 ../../packages/lib/client-only/providers/envelope-editor-provider.tsx(220,33): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string'.
12:20:00.386 ../../packages/lib/client-only/providers/envelope-editor-provider.tsx(241,18): error TS7006: Parameter 'prev' implicitly has an 'any' type.
12:20:00.386 ../../packages/lib/client-only/providers/envelope-editor-provider.tsx(263,10): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.386 ../../packages/lib/client-only/providers/envelope-editor-provider.tsx(298,18): error TS7006: Parameter 'prev' implicitly has an 'any' type.
12:20:00.386 ../../packages/lib/client-only/providers/envelope-render-provider.tsx(4,15): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.386 ../../packages/lib/client-only/providers/envelope-render-provider.tsx(4,22): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.386 ../../packages/lib/client-only/providers/envelope-render-provider.tsx(110,40): error TS7006: Parameter 'a' implicitly has an 'any' type.
12:20:00.386 ../../packages/lib/client-only/providers/envelope-render-provider.tsx(110,43): error TS7006: Parameter 'b' implicitly has an 'any' type.
12:20:00.386 ../../packages/lib/client-only/providers/envelope-render-provider.tsx(166,52): error TS7006: Parameter 'item' implicitly has an 'any' type.
12:20:00.386 ../../packages/lib/client-only/providers/envelope-render-provider.tsx(173,45): error TS7006: Parameter 'item' implicitly has an 'any' type.
12:20:00.386 ../../packages/lib/client-only/providers/envelope-render-provider.tsx(184,57): error TS7006: Parameter 'item' implicitly has an 'any' type.
12:20:00.386 ../../packages/lib/client-only/providers/session.tsx(4,15): error TS2305: Module '"@prisma/client"' has no exported member 'Session'.
12:20:00.386 ../../packages/lib/client-only/recipient-type.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.386 ../../packages/lib/client-only/recipient-type.ts(3,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentDistributionMethod'.
12:20:00.386 ../../packages/lib/client-only/recipient-type.ts(4,3): error TS2305: Module '"@prisma/client"' has no exported member 'ReadStatus'.
12:20:00.386 ../../packages/lib/client-only/recipient-type.ts(5,3): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.386 ../../packages/lib/client-only/recipient-type.ts(6,3): error TS2305: Module '"@prisma/client"' has no exported member 'SendStatus'.
12:20:00.386 ../../packages/lib/client-only/recipient-type.ts(7,3): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.386 ../../packages/lib/constants/autosign.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.386 ../../packages/lib/constants/billing.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'SubscriptionStatus'.
12:20:00.386 ../../packages/lib/constants/document.ts(3,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentDistributionMethod'.
12:20:00.386 ../../packages/lib/constants/document.ts(3,38): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.386 ../../packages/lib/constants/organisations-translations.ts(7,15): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberRole'.
12:20:00.395 ../../packages/lib/constants/organisations.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationGroupType'.
12:20:00.396 ../../packages/lib/constants/organisations.ts(1,33): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberRole'.
12:20:00.396 ../../packages/lib/constants/recipient-roles.ts(3,10): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.396 ../../packages/lib/constants/teams-translations.ts(3,15): error TS2305: Module '"@prisma/client"' has no exported member 'TeamMemberRole'.
12:20:00.396 ../../packages/lib/constants/teams.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentVisibility'.
12:20:00.396 ../../packages/lib/constants/teams.ts(1,30): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationGroupType'.
12:20:00.396 ../../packages/lib/constants/teams.ts(1,53): error TS2305: Module '"@prisma/client"' has no exported member 'TeamMemberRole'.
12:20:00.396 ../../packages/lib/jobs/client/local.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'BackgroundJobStatus'.
12:20:00.396 ../../packages/lib/jobs/client/local.ts(58,48): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'InputJsonValue'.
12:20:00.396 ../../packages/lib/jobs/client/local.ts(286,48): error TS2339: Property 'JsonNull' does not exist on type 'typeof Prisma'.
12:20:00.396 ../../packages/lib/jobs/definitions/emails/send-document-cancelled-emails.handler.ts(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.396 ../../packages/lib/jobs/definitions/emails/send-document-cancelled-emails.handler.ts(4,24): error TS2305: Module '"@prisma/client"' has no exported member 'ReadStatus'.
12:20:00.396 ../../packages/lib/jobs/definitions/emails/send-document-cancelled-emails.handler.ts(4,36): error TS2305: Module '"@prisma/client"' has no exported member 'SendStatus'.
12:20:00.396 ../../packages/lib/jobs/definitions/emails/send-document-cancelled-emails.handler.ts(4,48): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.396 ../../packages/lib/jobs/definitions/emails/send-document-cancelled-emails.handler.ts(79,6): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.396 ../../packages/lib/jobs/definitions/emails/send-document-cancelled-emails.handler.ts(87,37): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.396 ../../packages/lib/jobs/definitions/emails/send-recipient-signed-email.handler.ts(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.396 ../../packages/lib/jobs/definitions/emails/send-rejection-emails.handler.ts(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.396 ../../packages/lib/jobs/definitions/emails/send-rejection-emails.handler.ts(4,24): error TS2305: Module '"@prisma/client"' has no exported member 'SendStatus'.
12:20:00.396 ../../packages/lib/jobs/definitions/emails/send-rejection-emails.handler.ts(4,36): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.396 ../../packages/lib/jobs/definitions/emails/send-signing-email.handler.ts(5,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSource'.
12:20:00.396 ../../packages/lib/jobs/definitions/emails/send-signing-email.handler.ts(6,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.396 ../../packages/lib/jobs/definitions/emails/send-signing-email.handler.ts(7,3): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.396 ../../packages/lib/jobs/definitions/emails/send-signing-email.handler.ts(8,3): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationType'.
12:20:00.396 ../../packages/lib/jobs/definitions/emails/send-signing-email.handler.ts(9,3): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.396 ../../packages/lib/jobs/definitions/emails/send-signing-email.handler.ts(10,3): error TS2305: Module '"@prisma/client"' has no exported member 'SendStatus'.
12:20:00.396 ../../packages/lib/jobs/definitions/internal/bulk-send-template.handler.ts(63,43): error TS7006: Parameter '*' implicitly has an 'any' type.
12:20:00.396 ../../packages/lib/jobs/definitions/internal/bulk-send-template.handler.ts(63,46): error TS7006: Parameter 'index' implicitly has an 'any' type.
12:20:00.396 ../../packages/lib/jobs/definitions/internal/bulk-send-template.handler.ts(114,39): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.396 ../../packages/lib/jobs/definitions/internal/bulk-send-template.handler.ts(114,50): error TS7006: Parameter 'index' implicitly has an 'any' type.
12:20:00.396 ../../packages/lib/jobs/definitions/internal/execute-webhook.handler.ts(1,18): error TS2305: Module '"@prisma/client"' has no exported member 'WebhookCallStatus'.
12:20:00.396 ../../packages/lib/jobs/definitions/internal/execute-webhook.handler.ts(43,28): error TS2694: Namespace '"/vercel/path0/node*modules/.prisma/client/default".Prisma' has no exported member 'InputJsonValue'.
12:20:00.396 ../../packages/lib/jobs/definitions/internal/execute-webhook.handler.ts(43,52): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'JsonNullValueInput'.
12:20:00.397 ../../packages/lib/jobs/definitions/internal/execute-webhook.handler.ts(43,80): error TS2339: Property 'JsonNull' does not exist on type 'typeof Prisma'.
12:20:00.397 ../../packages/lib/jobs/definitions/internal/execute-webhook.handler.ts(56,42): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'InputJsonValue'.
12:20:00.397 ../../packages/lib/jobs/definitions/internal/execute-webhook.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'WebhookTriggerEvents'.
12:20:00.397 ../../packages/lib/jobs/definitions/internal/seal-document.handler.ts(10,15): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentData'.
12:20:00.397 ../../packages/lib/jobs/definitions/internal/seal-document.handler.ts(10,29): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentMeta'.
12:20:00.397 ../../packages/lib/jobs/definitions/internal/seal-document.handler.ts(10,43): error TS2305: Module '"@prisma/client"' has no exported member 'Envelope'.
12:20:00.397 ../../packages/lib/jobs/definitions/internal/seal-document.handler.ts(10,53): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeItem'.
12:20:00.397 ../../packages/lib/jobs/definitions/internal/seal-document.handler.ts(10,67): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.397 ../../packages/lib/jobs/definitions/internal/seal-document.handler.ts(12,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.397 ../../packages/lib/jobs/definitions/internal/seal-document.handler.ts(13,3): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.397 ../../packages/lib/jobs/definitions/internal/seal-document.handler.ts(14,3): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.397 ../../packages/lib/jobs/definitions/internal/seal-document.handler.ts(15,3): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.397 ../../packages/lib/jobs/definitions/internal/seal-document.handler.ts(16,3): error TS2305: Module '"@prisma/client"' has no exported member 'WebhookTriggerEvents'.
12:20:00.397 ../../packages/lib/jobs/definitions/internal/seal-document.handler.ts(107,33): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.397 ../../packages/lib/jobs/definitions/internal/seal-document.handler.ts(109,10): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.397 ../../packages/lib/jobs/definitions/internal/seal-document.handler.ts(136,8): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.397 ../../packages/lib/jobs/definitions/internal/seal-document.handler.ts(161,42): error TS7006: Parameter 'envelopeItem' implicitly has an 'any' type.
12:20:00.397 ../../packages/lib/jobs/definitions/internal/seal-document.handler.ts(186,7): error TS2739: Type 'Omit<OrganisationGlobalSettings, "id">' is missing the following properties from type '{ includeSigningCertificate: boolean; includeAuditLog: boolean; }': includeSigningCertificate, includeAuditLog
12:20:00.397 ../../packages/lib/jobs/definitions/internal/seal-document.handler.ts(193,10): error TS7006: Parameter 'item' implicitly has an 'any' type.
12:20:00.397 ../../packages/lib/jobs/definitions/internal/seal-document.handler.ts(213,38): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.397 ../../packages/lib/jobs/definitions/internal/seal-document.handler.ts(429,9): error TS2322: Type 'unknown' is not assignable to type 'any[]'.
12:20:00.397 ../../packages/lib/server-only/2fa/disable-2fa.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'User'.
12:20:00.397 ../../packages/lib/server-only/2fa/disable-2fa.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'UserSecurityAuditLogType'.
12:20:00.397 ../../packages/lib/server-only/2fa/disable-2fa.ts(42,36): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.397 ../../packages/lib/server-only/2fa/email/send-2fa-token-email.ts(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.398 ../../packages/lib/server-only/2fa/email/send-2fa-token-email.ts(112,12): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.398 ../../packages/lib/server-only/2fa/enable-2fa.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'User'.
12:20:00.398 ../../packages/lib/server-only/2fa/enable-2fa.ts(1,21): error TS2305: Module '"@prisma/client"' has no exported member 'UserSecurityAuditLogType'.
12:20:00.398 ../../packages/lib/server-only/2fa/enable-2fa.ts(37,36): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.398 ../../packages/lib/server-only/2fa/get-backup-code.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'User'.
12:20:00.398 ../../packages/lib/server-only/2fa/is-2fa-availble.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'User'.
12:20:00.398 ../../packages/lib/server-only/2fa/setup-2fa.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'User'.
12:20:00.398 ../../packages/lib/server-only/2fa/validate-2fa.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'User'.
12:20:00.398 ../../packages/lib/server-only/2fa/verify-2fa-token.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'User'.
12:20:00.398 ../../packages/lib/server-only/2fa/verify-backup-code.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'User'.
12:20:00.398 ../../packages/lib/server-only/2fa/view-backup-codes.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'User'.
12:20:00.398 ../../packages/lib/server-only/admin/admin-find-documents.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.398 ../../packages/lib/server-only/admin/admin-find-documents.ts(18,27): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'EnvelopeWhereInput'.
12:20:00.398 ../../packages/lib/server-only/admin/admin-super-delete-document.ts(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.398 ../../packages/lib/server-only/admin/admin-super-delete-document.ts(4,26): error TS2305: Module '"@prisma/client"' has no exported member 'SendStatus'.
12:20:00.398 ../../packages/lib/server-only/admin/admin-super-delete-document.ts(68,58): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.398 ../../packages/lib/server-only/admin/admin-super-delete-document.ts(79,37): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.398 ../../packages/lib/server-only/admin/admin-super-delete-document.ts(121,43): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.398 ../../packages/lib/server-only/admin/get-documents-stats.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.398 ../../packages/lib/server-only/admin/get-documents-stats.ts(25,19): error TS7006: Parameter 'stat' implicitly has an 'any' type.
12:20:00.398 ../../packages/lib/server-only/admin/get-entire-document.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.398 ../../packages/lib/server-only/admin/get-organisation-detailed-insights.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.398 ../../packages/lib/server-only/admin/get-organisation-detailed-insights.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.398 ../../packages/lib/server-only/admin/get-recipients-stats.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'ReadStatus'.
12:20:00.399 ../../packages/lib/server-only/admin/get-recipients-stats.ts(1,22): error TS2305: Module '"@prisma/client"' has no exported member 'SendStatus'.
12:20:00.399 ../../packages/lib/server-only/admin/get-recipients-stats.ts(1,34): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.399 ../../packages/lib/server-only/admin/get-recipients-stats.ts(22,20): error TS7006: Parameter 'result' implicitly has an 'any' type.
12:20:00.399 ../../packages/lib/server-only/admin/get-signing-volume.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.399 ../../packages/lib/server-only/admin/get-signing-volume.ts(1,26): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.399 ../../packages/lib/server-only/admin/get-users-stats.ts(47,22): error TS7006: Parameter 'row' implicitly has an 'any' type.
12:20:00.399 ../../packages/lib/server-only/admin/update-recipient.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.399 ../../packages/lib/server-only/admin/update-user.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'Role'.
12:20:00.399 ../../packages/lib/server-only/ai/envelope/detect-fields/helpers.ts(80,9): error TS2488: Type 'unknown' must have a '[Symbol.iterator]()' method that returns an iterator.
12:20:00.399 ../../packages/lib/server-only/ai/envelope/detect-fields/helpers.ts(84,5): error TS2322: Type 'unknown' is not assignable to type 'string'.
12:20:00.399 ../../packages/lib/server-only/ai/envelope/detect-fields/helpers.ts(89,5): error TS2322: Type 'unknown' is not assignable to type '"low" | "medium-low" | "medium" | "medium-high" | "high"'.
12:20:00.399 ../../packages/lib/server-only/ai/envelope/detect-fields/index.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.399 ../../packages/lib/server-only/ai/envelope/detect-fields/index.ts(2,31): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.399 ../../packages/lib/server-only/ai/envelope/detect-fields/index.ts(2,38): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.399 ../../packages/lib/server-only/ai/envelope/detect-fields/index.ts(60,67): error TS7006: Parameter 'r' implicitly has an 'any' type.
12:20:00.399 ../../packages/lib/server-only/ai/envelope/detect-fields/index.ts(115,24): error TS18047: 'resolvedRecipient' is possibly 'null'.
12:20:00.399 ../../packages/lib/server-only/ai/envelope/detect-fields/schema.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.399 ../../packages/lib/server-only/ai/envelope/detect-fields/types.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.399 ../../packages/lib/server-only/ai/envelope/detect-recipients/index.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.399 ../../packages/lib/server-only/ai/envelope/detect-recipients/index.ts(113,28): error TS2339: Property 'toLowerCase' does not exist on type '{}'.
12:20:00.399 ../../packages/lib/server-only/ai/envelope/detect-recipients/index.ts(113,61): error TS2339: Property 'toLowerCase' does not exist on type '{}'.
12:20:00.399 ../../packages/lib/server-only/ai/envelope/detect-recipients/index.ts(117,27): error TS2339: Property 'toLowerCase' does not exist on type '{}'.
12:20:00.399 ../../packages/lib/server-only/ai/envelope/detect-recipients/index.ts(117,59): error TS2339: Property 'toLowerCase' does not exist on type '{}'.
12:20:00.399 ../../packages/lib/server-only/ai/envelope/detect-recipients/schema.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.399 ../../packages/lib/server-only/auth/create-passkey-authentication-options.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'Passkey'.
12:20:00.399 ../../packages/lib/server-only/auth/create-passkey-registration-options.ts(40,39): error TS7006: Parameter 'passkey' implicitly has an 'any' type.
12:20:00.399 ../../packages/lib/server-only/auth/create-passkey.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'UserSecurityAuditLogType'.
12:20:00.399 ../../packages/lib/server-only/auth/create-passkey.ts(89,36): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.399 ../../packages/lib/server-only/auth/delete-passkey.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'UserSecurityAuditLogType'.
12:20:00.399 ../../packages/lib/server-only/auth/delete-passkey.ts(25,36): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.399 ../../packages/lib/server-only/auth/find-passkeys.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'Passkey'.
12:20:00.399 ../../packages/lib/server-only/auth/find-passkeys.ts(16,20): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'NullsOrder'.
12:20:00.399 ../../packages/lib/server-only/auth/find-passkeys.ts(29,30): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'NullsOrder'.
12:20:00.399 ../../packages/lib/server-only/auth/find-passkeys.ts(31,29): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'PasskeyWhereInput'.
12:20:00.399 ../../packages/lib/server-only/auth/find-passkeys.ts(38,20): error TS2339: Property 'QueryMode' does not exist on type 'typeof Prisma'.
12:20:00.399 ../../packages/lib/server-only/auth/update-passkey.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'UserSecurityAuditLogType'.
12:20:00.399 ../../packages/lib/server-only/auth/update-passkey.ts(31,36): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.399 ../../packages/lib/server-only/document-data/create-document-data.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentDataType'.
12:20:00.399 ../../packages/lib/server-only/document-meta/upsert-document-meta.ts(2,8): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentDistributionMethod'.
12:20:00.399 ../../packages/lib/server-only/document-meta/upsert-document-meta.ts(3,8): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSigningOrder'.
12:20:00.399 ../../packages/lib/server-only/document-meta/upsert-document-meta.ts(4,3): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.399 ../../packages/lib/server-only/document-meta/upsert-document-meta.ts(102,43): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.399 ../../packages/lib/server-only/document/complete-document-with-token.ts(2,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSigningOrder'.
12:20:00.399 ../../packages/lib/server-only/document/complete-document-with-token.ts(3,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.399 ../../packages/lib/server-only/document/complete-document-with-token.ts(4,3): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.399 ../../packages/lib/server-only/document/complete-document-with-token.ts(5,3): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.399 ../../packages/lib/server-only/document/complete-document-with-token.ts(6,3): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.399 ../../packages/lib/server-only/document/complete-document-with-token.ts(7,3): error TS2305: Module '"@prisma/client"' has no exported member 'SendStatus'.
12:20:00.399 ../../packages/lib/server-only/document/complete-document-with-token.ts(8,3): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.399 ../../packages/lib/server-only/document/complete-document-with-token.ts(9,3): error TS2305: Module '"@prisma/client"' has no exported member 'WebhookTriggerEvents'.
12:20:00.399 ../../packages/lib/server-only/document/complete-document-with-token.ts(136,20): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.399 ../../packages/lib/server-only/document/complete-document-with-token.ts(145,20): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.399 ../../packages/lib/server-only/document/complete-document-with-token.ts(216,36): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.407 ../../packages/lib/server-only/document/complete-document-with-token.ts(322,40): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.407 ../../packages/lib/server-only/document/delete-document.ts(4,15): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentMeta'.
12:20:00.407 ../../packages/lib/server-only/document/delete-document.ts(4,29): error TS2305: Module '"@prisma/client"' has no exported member 'Envelope'.
12:20:00.407 ../../packages/lib/server-only/document/delete-document.ts(4,39): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.407 ../../packages/lib/server-only/document/delete-document.ts(4,50): error TS2305: Module '"@prisma/client"' has no exported member 'User'.
12:20:00.407 ../../packages/lib/server-only/document/delete-document.ts(5,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.407 ../../packages/lib/server-only/document/delete-document.ts(5,26): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.407 ../../packages/lib/server-only/document/delete-document.ts(5,40): error TS2305: Module '"@prisma/client"' has no exported member 'SendStatus'.
12:20:00.407 ../../packages/lib/server-only/document/delete-document.ts(5,52): error TS2305: Module '"@prisma/client"' has no exported member 'WebhookTriggerEvents'.
12:20:00.407 ../../packages/lib/server-only/document/delete-document.ts(81,51): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.407 ../../packages/lib/server-only/document/delete-document.ts(154,45): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.407 ../../packages/lib/server-only/document/delete-document.ts(178,60): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.407 ../../packages/lib/server-only/document/delete-document.ts(212,36): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.407 ../../packages/lib/server-only/document/find-document-audit-logs.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentAuditLog'.
12:20:00.407 ../../packages/lib/server-only/document/find-document-audit-logs.ts(1,33): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.407 ../../packages/lib/server-only/document/find-document-audit-logs.ts(56,29): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'DocumentAuditLogWhereInput'.
12:20:00.407 ../../packages/lib/server-only/document/find-document-audit-logs.ts(104,32): error TS7006: Parameter 'auditLog' implicitly has an 'any' type.
12:20:00.407 ../../packages/lib/server-only/document/find-documents.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSource'.
12:20:00.407 ../../packages/lib/server-only/document/find-documents.ts(1,31): error TS2305: Module '"@prisma/client"' has no exported member 'Envelope'.
12:20:00.407 ../../packages/lib/server-only/document/find-documents.ts(1,49): error TS2305: Module '"@prisma/client"' has no exported member 'Team'.
12:20:00.407 ../../packages/lib/server-only/document/find-documents.ts(1,55): error TS2305: Module '"@prisma/client"' has no exported member 'TeamEmail'.
12:20:00.407 ../../packages/lib/server-only/document/find-documents.ts(1,66): error TS2305: Module '"@prisma/client"' has no exported member 'User'.
12:20:00.407 ../../packages/lib/server-only/document/find-documents.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.407 ../../packages/lib/server-only/document/find-documents.ts(2,24): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.407 ../../packages/lib/server-only/document/find-documents.ts(2,39): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.407 ../../packages/lib/server-only/document/find-documents.ts(2,54): error TS2305: Module '"@prisma/client"' has no exported member 'TeamMemberRole'.
12:20:00.407 ../../packages/lib/server-only/document/find-documents.ts(72,30): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'EnvelopeWhereInput'.
12:20:00.407 ../../packages/lib/server-only/document/find-documents.ts(114,23): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'EnvelopeWhereInput'.
12:20:00.407 ../../packages/lib/server-only/document/find-documents.ts(130,29): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'EnvelopeWhereInput'.
12:20:00.407 ../../packages/lib/server-only/document/find-documents.ts(183,32): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'EnvelopeWhereInput'.
12:20:00.407 ../../packages/lib/server-only/document/find-documents.ts(201,29): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'EnvelopeWhereInput'.
12:20:00.407 ../../packages/lib/server-only/document/find-documents.ts(266,32): error TS7006: Parameter 'document' implicitly has an 'any' type.
12:20:00.408 ../../packages/lib/server-only/document/find-documents.ts(287,47): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'EnvelopeWhereInput'.
12:20:00.408 ../../packages/lib/server-only/document/find-documents.ts(426,29): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'EnvelopeWhereInput'.
12:20:00.408 ../../packages/lib/server-only/document/find-documents.ts(431,47): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'EnvelopeWhereInput'.
12:20:00.408 ../../packages/lib/server-only/document/find-documents.ts(433,28): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'EnvelopeWhereInput'.
12:20:00.408 ../../packages/lib/server-only/document/find-documents.ts(495,28): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'EnvelopeWhereInput'.
12:20:00.408 ../../packages/lib/server-only/document/find-documents.ts(520,28): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'EnvelopeWhereInput'.
12:20:00.408 ../../packages/lib/server-only/document/find-documents.ts(562,28): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'EnvelopeWhereInput'.
12:20:00.408 ../../packages/lib/server-only/document/find-documents.ts(594,28): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'EnvelopeWhereInput'.
12:20:00.408 ../../packages/lib/server-only/document/get-document-by-access-token.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.408 ../../packages/lib/server-only/document/get-document-by-access-token.ts(1,26): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.408 ../../packages/lib/server-only/document/get-document-by-token.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.408 ../../packages/lib/server-only/document/get-document-certificate-audit-logs.ts(28,39): error TS7006: Parameter 'log' implicitly has an 'any' type.
12:20:00.408 ../../packages/lib/server-only/document/get-document-certificate-audit-logs.ts(32,8): error TS7006: Parameter 'log' implicitly has an 'any' type.
12:20:00.408 ../../packages/lib/server-only/document/get-document-certificate-audit-logs.ts(35,8): error TS7006: Parameter 'log' implicitly has an 'any' type.
12:20:00.408 ../../packages/lib/server-only/document/get-document-certificate-audit-logs.ts(38,8): error TS7006: Parameter 'log' implicitly has an 'any' type.
12:20:00.408 ../../packages/lib/server-only/document/get-document-certificate-audit-logs.ts(41,8): error TS7006: Parameter 'log' implicitly has an 'any' type.
12:20:00.408 ../../packages/lib/server-only/document/get-document-certificate-audit-logs.ts(44,8): error TS7006: Parameter 'log' implicitly has an 'any' type.
12:20:00.408 ../../packages/lib/server-only/document/get-document-with-details-by-id.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.408 ../../packages/lib/server-only/document/get-document-with-details-by-id.ts(41,34): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.408 ../../packages/lib/server-only/document/get-document-with-details-by-id.ts(55,42): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.408 ../../packages/lib/server-only/document/get-document-with-details-by-id.ts(66,48): error TS7006: Parameter 'envelopeItem' implicitly has an 'any' type.
12:20:00.408 ../../packages/lib/server-only/document/get-stats.ts(1,23): error TS2305: Module '"@prisma/client"' has no exported member 'User'.
12:20:00.408 ../../packages/lib/server-only/document/get-stats.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentVisibility'.
12:20:00.408 ../../packages/lib/server-only/document/get-stats.ts(2,30): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.408 ../../packages/lib/server-only/document/get-stats.ts(2,44): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.408 ../../packages/lib/server-only/document/get-stats.ts(2,59): error TS2305: Module '"@prisma/client"' has no exported member 'TeamMemberRole'.
12:20:00.408 ../../packages/lib/server-only/document/get-stats.ts(26,25): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'EnvelopeWhereInput'.
12:20:00.408 ../../packages/lib/server-only/document/get-stats.ts(91,21): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'EnvelopeWhereInput'.
12:20:00.408 ../../packages/lib/server-only/document/get-stats.ts(97,30): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'EnvelopeWhereInput'.
12:20:00.408 ../../packages/lib/server-only/document/get-stats.ts(190,21): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'EnvelopeWhereInput'.
12:20:00.408 ../../packages/lib/server-only/document/get-stats.ts(201,35): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'EnvelopeWhereInput'.
12:20:00.408 ../../packages/lib/server-only/document/get-stats.ts(208,30): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'EnvelopeWhereInput'.
12:20:00.408 ../../packages/lib/server-only/document/get-stats.ts(218,37): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'EnvelopeWhereInput'.
12:20:00.408 ../../packages/lib/server-only/document/get-stats.ts(229,45): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'EnvelopeWhereInput'.
12:20:00.408 ../../packages/lib/server-only/document/get-stats.ts(318,24): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'EnvelopeGroupByArgs'.
12:20:00.408 ../../packages/lib/server-only/document/get-stats.ts(354,24): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'EnvelopeGroupByArgs'.
12:20:00.412 ../../packages/lib/server-only/document/is-recipient-authorized.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'Envelope'.
12:20:00.413 ../../packages/lib/server-only/document/is-recipient-authorized.ts(1,25): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.414 ../../packages/lib/server-only/document/reject-document-with-token.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.414 ../../packages/lib/server-only/document/reject-document-with-token.ts(1,24): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.414 ../../packages/lib/server-only/document/resend-document.ts(5,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.414 ../../packages/lib/server-only/document/resend-document.ts(6,3): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.414 ../../packages/lib/server-only/document/resend-document.ts(7,3): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationType'.
12:20:00.414 ../../packages/lib/server-only/document/resend-document.ts(8,3): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.414 ../../packages/lib/server-only/document/resend-document.ts(9,3): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.415 ../../packages/lib/server-only/document/resend-document.ts(98,6): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.415 ../../packages/lib/server-only/document/resend-document.ts(121,35): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.415 ../../packages/lib/server-only/document/resend-document.ts(196,16): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.415 ../../packages/lib/server-only/document/search-documents-with-keyword.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.415 ../../packages/lib/server-only/document/search-documents-with-keyword.ts(1,26): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.417 ../../packages/lib/server-only/document/search-documents-with-keyword.ts(2,15): error TS2305: Module '"@prisma/client"' has no exported member 'Envelope'.
12:20:00.417 ../../packages/lib/server-only/document/search-documents-with-keyword.ts(2,25): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.417 ../../packages/lib/server-only/document/search-documents-with-keyword.ts(2,36): error TS2305: Module '"@prisma/client"' has no exported member 'User'.
12:20:00.417 ../../packages/lib/server-only/document/search-documents-with-keyword.ts(3,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentVisibility'.
12:20:00.417 ../../packages/lib/server-only/document/search-documents-with-keyword.ts(3,30): error TS2305: Module '"@prisma/client"' has no exported member 'TeamMemberRole'.
12:20:00.417 ../../packages/lib/server-only/document/search-documents-with-keyword.ts(141,14): error TS7006: Parameter 'envelope' implicitly has an 'any' type.
12:20:00.417 ../../packages/lib/server-only/document/search-documents-with-keyword.ts(147,42): error TS7006: Parameter 'tg' implicitly has an 'any' type.
12:20:00.417 ../../packages/lib/server-only/document/search-documents-with-keyword.ts(165,11): error TS7006: Parameter 'envelope' implicitly has an 'any' type.
12:20:00.417 ../../packages/lib/server-only/document/search-documents-with-keyword.ts(187,74): error TS7006: Parameter 'r' implicitly has an 'any' type.
12:20:00.417 ../../packages/lib/server-only/document/send-completed-email.ts(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSource'.
12:20:00.417 ../../packages/lib/server-only/document/send-completed-email.ts(4,26): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.417 ../../packages/lib/server-only/document/send-completed-email.ts(85,39): error TS7006: Parameter 'envelopeItem' implicitly has an 'any' type.
12:20:00.417 ../../packages/lib/server-only/document/send-completed-email.ts(123,33): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.417 ../../packages/lib/server-only/document/send-completed-email.ts(180,58): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.417 ../../packages/lib/server-only/document/send-completed-email.ts(185,35): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.417 ../../packages/lib/server-only/document/send-document.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentData'.
12:20:00.417 ../../packages/lib/server-only/document/send-document.ts(1,29): error TS2305: Module '"@prisma/client"' has no exported member 'Envelope'.
12:20:00.417 ../../packages/lib/server-only/document/send-document.ts(1,39): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeItem'.
12:20:00.417 ../../packages/lib/server-only/document/send-document.ts(1,53): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.417 ../../packages/lib/server-only/document/send-document.ts(3,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSigningOrder'.
12:20:00.417 ../../packages/lib/server-only/document/send-document.ts(4,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.417 ../../packages/lib/server-only/document/send-document.ts(5,3): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.417 ../../packages/lib/server-only/document/send-document.ts(6,3): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.417 ../../packages/lib/server-only/document/send-document.ts(7,3): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.417 ../../packages/lib/server-only/document/send-document.ts(8,3): error TS2305: Module '"@prisma/client"' has no exported member 'SendStatus'.
12:20:00.420 ../../packages/lib/server-only/document/send-document.ts(9,3): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.420 ../../packages/lib/server-only/document/send-document.ts(10,3): error TS2305: Module '"@prisma/client"' has no exported member 'WebhookTriggerEvents'.
12:20:00.420 ../../packages/lib/server-only/document/send-document.ts(113,16): error TS7006: Parameter 'r' implicitly has an 'any' type.
12:20:00.420 ../../packages/lib/server-only/document/send-document.ts(118,32): error TS7006: Parameter 'r' implicitly has an 'any' type.
12:20:00.420 ../../packages/lib/server-only/document/send-document.ts(127,41): error TS7006: Parameter 'envelopeItem' implicitly has an 'any' type.
12:20:00.420 ../../packages/lib/server-only/document/send-document.ts(134,32): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.420 ../../packages/lib/server-only/document/send-document.ts(177,6): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.420 ../../packages/lib/server-only/document/send-document.ts(207,51): error TS7006: Parameter 'r' implicitly has an 'any' type.
12:20:00.420 ../../packages/lib/server-only/document/send-document.ts(224,60): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.420 ../../packages/lib/server-only/document/send-document.ts(291,37): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.420 ../../packages/lib/server-only/document/send-pending-email.ts(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.420 ../../packages/lib/server-only/document/validate-field-auth.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'Envelope'.
12:20:00.420 ../../packages/lib/server-only/document/validate-field-auth.ts(1,25): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.420 ../../packages/lib/server-only/document/validate-field-auth.ts(1,32): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.420 ../../packages/lib/server-only/document/validate-field-auth.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.420 ../../packages/lib/server-only/document/viewed-document.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.420 ../../packages/lib/server-only/document/viewed-document.ts(1,24): error TS2305: Module '"@prisma/client"' has no exported member 'ReadStatus'.
12:20:00.420 ../../packages/lib/server-only/document/viewed-document.ts(1,36): error TS2305: Module '"@prisma/client"' has no exported member 'SendStatus'.
12:20:00.420 ../../packages/lib/server-only/document/viewed-document.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'WebhookTriggerEvents'.
12:20:00.420 ../../packages/lib/server-only/document/viewed-document.ts(64,36): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.420 ../../packages/lib/server-only/email/get-email-context.ts(91,5): error TS2322: Type '{ allowedEmails: any; branding: { brandingLogo: string; brandingHidePoweredBy: boolean; }; settings: any; claims: any; organisationType: any; }' is not assignable to type 'Omit<EmailContextResponse, "senderEmail" | "replyToEmail" | "emailLanguage">'.
12:20:00.420 Types of property 'branding' are incompatible.
12:20:00.420 Type '{ brandingLogo: string; brandingHidePoweredBy: boolean; }' is missing the following properties from type 'BrandingContextValue': brandingEnabled, brandingUrl, brandingCompanyDetails
12:20:00.420 ../../packages/lib/server-only/email/get-email-context.ts(93,5): error TS2322: Type '{ allowedEmails: any; branding: { brandingLogo: string; brandingHidePoweredBy: boolean; }; settings: Omit<OrganisationGlobalSettings, "id">; claims: any; organisationType: any; }' is not assignable to type 'Omit<EmailContextResponse, "senderEmail" | "replyToEmail" | "emailLanguage">'.
12:20:00.420 Types of property 'branding' are incompatible.
12:20:00.420 Type '{ brandingLogo: string; brandingHidePoweredBy: boolean; }' is missing the following properties from type 'BrandingContextValue': brandingEnabled, brandingUrl, brandingCompanyDetails
12:20:00.420 ../../packages/lib/server-only/envelope-attachment/create-attachment.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.420 ../../packages/lib/server-only/envelope-attachment/delete-attachment.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.420 ../../packages/lib/server-only/envelope-attachment/update-attachment.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.420 ../../packages/lib/server-only/envelope/create-envelope.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentMeta'.
12:20:00.420 ../../packages/lib/server-only/envelope/create-envelope.ts(1,29): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentVisibility'.
12:20:00.420 ../../packages/lib/server-only/envelope/create-envelope.ts(1,49): error TS2305: Module '"@prisma/client"' has no exported member 'TemplateType'.
12:20:00.420 ../../packages/lib/server-only/envelope/create-envelope.ts(3,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSource'.
12:20:00.420 ../../packages/lib/server-only/envelope/create-envelope.ts(4,3): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.421 ../../packages/lib/server-only/envelope/create-envelope.ts(5,3): error TS2305: Module '"@prisma/client"' has no exported member 'FolderType'.
12:20:00.421 ../../packages/lib/server-only/envelope/create-envelope.ts(6,3): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.421 ../../packages/lib/server-only/envelope/create-envelope.ts(7,3): error TS2305: Module '"@prisma/client"' has no exported member 'SendStatus'.
12:20:00.421 ../../packages/lib/server-only/envelope/create-envelope.ts(8,3): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.421 ../../packages/lib/server-only/envelope/create-envelope.ts(9,3): error TS2305: Module '"@prisma/client"' has no exported member 'WebhookTriggerEvents'.
12:20:00.421 ../../packages/lib/server-only/envelope/create-envelope.ts(259,43): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.421 ../../packages/lib/server-only/envelope/create-envelope.ts(321,16): error TS7006: Parameter 'item' implicitly has an 'any' type.
12:20:00.421 ../../packages/lib/server-only/envelope/duplicate-envelope.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSource'.
12:20:00.421 ../../packages/lib/server-only/envelope/duplicate-envelope.ts(1,26): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.421 ../../packages/lib/server-only/envelope/duplicate-envelope.ts(1,40): error TS2305: Module '"@prisma/client"' has no exported member 'WebhookTriggerEvents'.
12:20:00.421 ../../packages/lib/server-only/envelope/duplicate-envelope.ts(116,39): error TS7006: Parameter 'envelopeItem' implicitly has an 'any' type.
12:20:00.421 ../../packages/lib/server-only/envelope/duplicate-envelope.ts(150,41): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.421 ../../packages/lib/server-only/envelope/get-envelope-by-id.ts(2,15): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.421 ../../packages/lib/server-only/envelope/get-envelope-by-id.ts(148,33): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'EnvelopeWhereInput'.
12:20:00.421 ../../packages/lib/server-only/envelope/get-envelope-by-id.ts(175,36): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'EnvelopeWhereUniqueInput'.
12:20:00.421 ../../packages/lib/server-only/envelope/get-envelope-for-direct-template-signing.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.421 ../../packages/lib/server-only/envelope/get-envelope-for-direct-template-signing.ts(1,26): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.421 ../../packages/lib/server-only/envelope/get-envelope-for-direct-template-signing.ts(88,6): error TS7006: Parameter 'r' implicitly has an 'any' type.
12:20:00.421 ../../packages/lib/server-only/envelope/get-envelope-for-direct-template-signing.ts(148,37): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.423 ../../packages/lib/server-only/envelope/get-envelope-for-recipient-signing.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSigningOrder'.
12:20:00.423 ../../packages/lib/server-only/envelope/get-envelope-for-recipient-signing.ts(1,32): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.423 ../../packages/lib/server-only/envelope/get-envelope-for-recipient-signing.ts(1,48): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.423 ../../packages/lib/server-only/envelope/get-envelope-for-recipient-signing.ts(1,62): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.423 ../../packages/lib/server-only/envelope/get-envelope-for-recipient-signing.ts(5,32): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/DocumentMetaSchema' or its corresponding type declarations.
12:20:00.427 ../../packages/lib/server-only/envelope/get-envelope-for-recipient-signing.ts(6,32): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/EnvelopeItemSchema' or its corresponding type declarations.
12:20:00.427 ../../packages/lib/server-only/envelope/get-envelope-for-recipient-signing.ts(7,28): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/EnvelopeSchema' or its corresponding type declarations.
12:20:00.427 ../../packages/lib/server-only/envelope/get-envelope-for-recipient-signing.ts(8,29): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/SignatureSchema' or its corresponding type declarations.
12:20:00.427 ../../packages/lib/server-only/envelope/get-envelope-for-recipient-signing.ts(9,24): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/TeamSchema' or its corresponding type declarations.
12:20:00.427 ../../packages/lib/server-only/envelope/get-envelope-for-recipient-signing.ts(10,24): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/UserSchema' or its corresponding type declarations.
12:20:00.427 ../../packages/lib/server-only/envelope/get-envelope-for-recipient-signing.ts(211,56): error TS7006: Parameter 'r' implicitly has an 'any' type.
12:20:00.427 ../../packages/lib/server-only/envelope/get-envelope-for-recipient-signing.ts(259,64): error TS7006: Parameter 'r' implicitly has an 'any' type.
12:20:00.427 ../../packages/lib/server-only/envelope/get-envelope-required-access-data.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.427 ../../packages/lib/server-only/envelope/get-envelope-required-access-data.ts(1,26): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.427 ../../packages/lib/server-only/envelope/get-envelope-required-access-data.ts(35,47): error TS7006: Parameter 'r' implicitly has an 'any' type.
12:20:00.427 ../../packages/lib/server-only/envelope/orphan-envelopes.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.427 ../../packages/lib/server-only/envelope/orphan-envelopes.ts(1,26): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.427 ../../packages/lib/server-only/envelope/update-envelope.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentMeta'.
12:20:00.427 ../../packages/lib/server-only/envelope/update-envelope.ts(1,29): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentVisibility'.
12:20:00.427 ../../packages/lib/server-only/envelope/update-envelope.ts(1,57): error TS2305: Module '"@prisma/client"' has no exported member 'TemplateType'.
12:20:00.427 ../../packages/lib/server-only/envelope/update-envelope.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.427 ../../packages/lib/server-only/envelope/update-envelope.ts(2,24): error TS2305: Module '"@prisma/client"' has no exported member 'FolderType'.
12:20:00.427 ../../packages/lib/server-only/envelope/update-envelope.ts(3,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.427 ../../packages/lib/server-only/envelope/update-envelope.ts(148,33): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'FolderUpdateOneWithoutEnvelopesNestedInput'.
12:20:00.427 ../../packages/lib/server-only/envelope/update-envelope.ts(312,43): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.427 ../../packages/lib/server-only/field/create-envelope-fields.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.427 ../../packages/lib/server-only/field/create-envelope-fields.ts(87,49): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.427 ../../packages/lib/server-only/field/create-envelope-fields.ts(92,37): error TS7006: Parameter 'envelopeItem' implicitly has an 'any' type.
12:20:00.427 ../../packages/lib/server-only/field/create-envelope-fields.ts(121,58): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.427 ../../packages/lib/server-only/field/create-envelope-fields.ts(142,39): error TS7006: Parameter 'createdField' implicitly has an 'any' type.
12:20:00.427 ../../packages/lib/server-only/field/create-envelope-fields.ts(166,32): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.427 ../../packages/lib/server-only/field/delete-document-field.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.427 ../../packages/lib/server-only/field/delete-document-field.ts(74,47): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.427 ../../packages/lib/server-only/field/delete-document-field.ts(89,43): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.427 ../../packages/lib/server-only/field/delete-template-field.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.427 ../../packages/lib/server-only/field/get-completed-fields-for-token.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.427 ../../packages/lib/server-only/field/get-completed-fields-for-token.ts(1,24): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.427 ../../packages/lib/server-only/field/get-field-by-id.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.427 ../../packages/lib/server-only/field/get-fields-for-token.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.427 ../../packages/lib/server-only/field/get-fields-for-token.ts(1,24): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.427 ../../packages/lib/server-only/field/get-fields-for-token.ts(1,35): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.427 ../../packages/lib/server-only/field/get-fields-for-token.ts(1,50): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.427 ../../packages/lib/server-only/field/remove-signed-field-with-token.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.427 ../../packages/lib/server-only/field/remove-signed-field-with-token.ts(1,26): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.428 ../../packages/lib/server-only/field/remove-signed-field-with-token.ts(1,41): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.428 ../../packages/lib/server-only/field/remove-signed-field-with-token.ts(71,36): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.428 ../../packages/lib/server-only/field/set-fields-for-document.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.428 ../../packages/lib/server-only/field/set-fields-for-document.ts(1,29): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.428 ../../packages/lib/server-only/field/set-fields-for-document.ts(1,36): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.428 ../../packages/lib/server-only/field/set-fields-for-document.ts(86,6): error TS7006: Parameter 'existingField' implicitly has an 'any' type.
12:20:00.428 ../../packages/lib/server-only/field/set-fields-for-document.ts(90,43): error TS7006: Parameter 'existingField' implicitly has an 'any' type.
12:20:00.428 ../../packages/lib/server-only/field/set-fields-for-document.ts(92,49): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.428 ../../packages/lib/server-only/field/set-fields-for-document.ts(96,8): error TS7006: Parameter 'envelopeItem' implicitly has an 'any' type.
12:20:00.428 ../../packages/lib/server-only/field/set-fields-for-document.ts(139,60): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.428 ../../packages/lib/server-only/field/set-fields-for-document.ts(318,38): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.428 ../../packages/lib/server-only/field/set-fields-for-document.ts(322,36): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.428 ../../packages/lib/server-only/field/set-fields-for-document.ts(328,34): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.428 ../../packages/lib/server-only/field/set-fields-for-document.ts(347,14): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.428 ../../packages/lib/server-only/field/set-fields-for-document.ts(348,45): error TS7006: Parameter 'removedField' implicitly has an 'any' type.
12:20:00.428 ../../packages/lib/server-only/field/set-fields-for-document.ts(349,47): error TS7006: Parameter 'persistedField' implicitly has an 'any' type.
12:20:00.428 ../../packages/lib/server-only/field/set-fields-for-document.ts(353,11): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.428 ../../packages/lib/server-only/field/set-fields-for-document.ts(358,55): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.428 ../../packages/lib/server-only/field/set-fields-for-template.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.428 ../../packages/lib/server-only/field/set-fields-for-template.ts(1,24): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.428 ../../packages/lib/server-only/field/set-fields-for-template.ts(82,6): error TS7006: Parameter 'existingField' implicitly has an 'any' type.
12:20:00.428 ../../packages/lib/server-only/field/set-fields-for-template.ts(86,43): error TS7006: Parameter 'existingField' implicitly has an 'any' type.
12:20:00.428 ../../packages/lib/server-only/field/set-fields-for-template.ts(88,49): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.428 ../../packages/lib/server-only/field/set-fields-for-template.ts(92,8): error TS7006: Parameter 'envelopeItem' implicitly has an 'any' type.
12:20:00.428 ../../packages/lib/server-only/field/set-fields-for-template.ts(235,34): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.428 ../../packages/lib/server-only/field/set-fields-for-template.ts(242,49): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.428 ../../packages/lib/server-only/field/set-fields-for-template.ts(243,43): error TS7006: Parameter 'removedField' implicitly has an 'any' type.
12:20:00.428 ../../packages/lib/server-only/field/set-fields-for-template.ts(249,52): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.428 ../../packages/lib/server-only/field/sign-field-with-token.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.428 ../../packages/lib/server-only/field/sign-field-with-token.ts(1,26): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.428 ../../packages/lib/server-only/field/sign-field-with-token.ts(1,37): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.428 ../../packages/lib/server-only/field/sign-field-with-token.ts(1,52): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.428 ../../packages/lib/server-only/field/sign-field-with-token.ts(218,61): error TS2339: Property 'text' does not exist on type '{ type: "text"; }'.
12:20:00.428 ../../packages/lib/server-only/field/sign-field-with-token.ts(219,63): error TS2339: Property 'value' does not exist on type '{ type: "number"; }'.
12:20:00.428 ../../packages/lib/server-only/field/sign-field-with-token.ts(223,16): error TS2339: Property 'values' does not exist on type '{ type: "checkbox"; }'.
12:20:00.428 ../../packages/lib/server-only/field/sign-field-with-token.ts(223,32): error TS7006: Parameter 'v' implicitly has an 'any' type.
12:20:00.428 ../../packages/lib/server-only/field/sign-field-with-token.ts(223,54): error TS7006: Parameter 'v' implicitly has an 'any' type.
12:20:00.428 ../../packages/lib/server-only/field/sign-field-with-token.ts(226,62): error TS2339: Property 'values' does not exist on type '{ type: "radio"; }'.
12:20:00.428 ../../packages/lib/server-only/field/sign-field-with-token.ts(226,76): error TS7006: Parameter 'v' implicitly has an 'any' type.
12:20:00.428 ../../packages/lib/server-only/field/sign-field-with-token.ts(227,65): error TS2339: Property 'defaultValue' does not exist on type '{ type: "dropdown"; }'.
12:20:00.428 ../../packages/lib/server-only/field/sign-field-with-token.ts(237,43): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.428 ../../packages/lib/server-only/field/sign-field-with-token.ts(315,14): error TS2349: This expression is not callable.
12:20:00.428 Type 'NonExhaustiveError<any>' has no call signatures.
12:20:00.428 ../../packages/lib/server-only/field/update-envelope-fields.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.428 ../../packages/lib/server-only/field/update-envelope-fields.ts(1,29): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.428 ../../packages/lib/server-only/field/update-envelope-fields.ts(74,49): error TS7006: Parameter 'existingField' implicitly has an 'any' type.
12:20:00.428 ../../packages/lib/server-only/field/update-envelope-fields.ts(83,8): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.429 ../../packages/lib/server-only/field/update-envelope-fields.ts(117,37): error TS7006: Parameter 'item' implicitly has an 'any' type.
12:20:00.429 ../../packages/lib/server-only/field/update-envelope-fields.ts(131,58): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.429 ../../packages/lib/server-only/field/update-envelope-fields.ts(178,32): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.429 ../../packages/lib/server-only/folder/find-folders-internal.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.429 ../../packages/lib/server-only/folder/find-folders-internal.ts(52,26): error TS7006: Parameter 'folder' implicitly has an 'any' type.
12:20:00.429 ../../packages/lib/server-only/folder/find-folders-internal.ts(86,65): error TS7006: Parameter 'subfolder' implicitly has an 'any' type.
12:20:00.429 ../../packages/lib/server-only/folder/find-folders.ts(30,29): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'FolderWhereInput'.
12:20:00.429 ../../packages/lib/server-only/folder/get-folder-breadcrumbs.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'TeamMemberRole'.
12:20:00.429 ../../packages/lib/server-only/folder/update-folder.ts(3,41): error TS2307: Cannot find module '@signtusk/prisma/generated/types' or its corresponding type declarations.
12:20:00.429 ../../packages/lib/server-only/htmltopdf/get-audit-logs-pdf.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.429 ../../packages/lib/server-only/htmltopdf/get-audit-logs-pdf.ts(40,59): error TS7006: Parameter 'log' implicitly has an 'any' type.
12:20:00.429 ../../packages/lib/server-only/htmltopdf/get-certificate-pdf.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.429 ../../packages/lib/server-only/htmltopdf/get-certificate-pdf.ts(33,6): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.429 ../../packages/lib/server-only/organisation/accept-organisation-invitation.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationGroup'.
12:20:00.429 ../../packages/lib/server-only/organisation/accept-organisation-invitation.ts(1,34): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberRole'.
12:20:00.429 ../../packages/lib/server-only/organisation/accept-organisation-invitation.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationGroupType'.
12:20:00.429 ../../packages/lib/server-only/organisation/accept-organisation-invitation.ts(2,33): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberInviteStatus'.
12:20:00.429 ../../packages/lib/server-only/organisation/accept-organisation-invitation.ts(115,12): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.429 ../../packages/lib/server-only/organisation/create-organisation-member-invites.ts(4,15): error TS2305: Module '"@prisma/client"' has no exported member 'Organisation'.
12:20:00.429 ../../packages/lib/server-only/organisation/create-organisation-member-invites.ts(5,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberInviteStatus'.
12:20:00.429 ../../packages/lib/server-only/organisation/create-organisation-member-invites.ts(86,62): error TS7006: Parameter 'member' implicitly has an 'any' type.
12:20:00.429 ../../packages/lib/server-only/organisation/create-organisation-member-invites.ts(87,68): error TS7006: Parameter 'invite' implicitly has an 'any' type.
12:20:00.429 ../../packages/lib/server-only/organisation/create-organisation-member-invites.ts(105,77): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string | number | symbol'.
12:20:00.429 ../../packages/lib/server-only/organisation/create-organisation-member-invites.ts(114,43): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'OrganisationMemberInviteCreateManyInput'.
12:20:00.429 ../../packages/lib/server-only/organisation/create-organisation.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationType'.
12:20:00.429 ../../packages/lib/server-only/organisation/create-organisation.ts(3,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberRole'.
12:20:00.429 ../../packages/lib/server-only/organisation/create-organisation.ts(62,43): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.429 ../../packages/lib/server-only/organisation/create-organisation.ts(113,15): error TS7006: Parameter 'err' implicitly has an 'any' type.
12:20:00.429 ../../packages/lib/server-only/organisation/create-organisation.ts(124,8): error TS7006: Parameter 'group' implicitly has an 'any' type.
12:20:00.429 ../../packages/lib/server-only/organisation/create-organisation.ts(202,12): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'SubscriptionClaimCreateInput'.
12:20:00.429 ../../packages/lib/server-only/pdf/insert-field-in-pdf-v1.ts(12,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.429 ../../packages/lib/server-only/pdf/insert-field-in-pdf-v1.ts(192,20): error TS7006: Parameter 'a' implicitly has an 'any' type.
12:20:00.429 ../../packages/lib/server-only/pdf/insert-field-in-pdf-v1.ts(192,23): error TS7006: Parameter 'b' implicitly has an 'any' type.
12:20:00.429 ../../packages/lib/server-only/pdf/legacy-insert-field-in-pdf.ts(5,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.429 ../../packages/lib/server-only/pdf/legacy-insert-field-in-pdf.ts(178,20): error TS7006: Parameter 'a' implicitly has an 'any' type.
12:20:00.429 ../../packages/lib/server-only/pdf/legacy-insert-field-in-pdf.ts(178,23): error TS7006: Parameter 'b' implicitly has an 'any' type.
12:20:00.429 ../../packages/lib/server-only/pdf/legacy-insert-field-in-pdf.ts(319,16): error TS7006: Parameter 'a' implicitly has an 'any' type.
12:20:00.429 ../../packages/lib/server-only/pdf/legacy-insert-field-in-pdf.ts(319,19): error TS7006: Parameter 'b' implicitly has an 'any' type.
12:20:00.429 ../../packages/lib/server-only/profile/get-public-profile-by-url.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'Envelope'.
12:20:00.431 ../../packages/lib/server-only/profile/get-public-profile-by-url.ts(1,25): error TS2305: Module '"@prisma/client"' has no exported member 'TemplateDirectLink'.
12:20:00.431 ../../packages/lib/server-only/profile/get-public-profile-by-url.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.431 ../../packages/lib/server-only/profile/get-public-profile-by-url.ts(2,29): error TS2305: Module '"@prisma/client"' has no exported member 'TeamProfile'.
12:20:00.431 ../../packages/lib/server-only/profile/get-public-profile-by-url.ts(2,42): error TS2305: Module '"@prisma/client"' has no exported member 'TemplateType'.
12:20:00.431 ../../packages/lib/server-only/profile/get-public-profile-by-url.ts(78,36): error TS7006: Parameter 'template' implicitly has an 'any' type.
12:20:00.431 ../../packages/lib/server-only/recipient/create-envelope-recipients.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.431 ../../packages/lib/server-only/recipient/create-envelope-recipients.ts(1,24): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.431 ../../packages/lib/server-only/recipient/create-envelope-recipients.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'SendStatus'.
12:20:00.431 ../../packages/lib/server-only/recipient/create-envelope-recipients.ts(2,22): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.431 ../../packages/lib/server-only/recipient/create-envelope-recipients.ts(91,62): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.431 ../../packages/lib/server-only/recipient/create-envelope-recipients.ts(139,40): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.431 ../../packages/lib/server-only/recipient/delete-envelope-recipient.ts(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.431 ../../packages/lib/server-only/recipient/delete-envelope-recipient.ts(4,24): error TS2305: Module '"@prisma/client"' has no exported member 'SendStatus'.
12:20:00.431 ../../packages/lib/server-only/recipient/delete-envelope-recipient.ts(112,61): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.431 ../../packages/lib/server-only/recipient/get-is-recipient-turn.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSigningOrder'.
12:20:00.431 ../../packages/lib/server-only/recipient/get-is-recipient-turn.ts(1,32): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.431 ../../packages/lib/server-only/recipient/get-is-recipient-turn.ts(1,46): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.431 ../../packages/lib/server-only/recipient/get-is-recipient-turn.ts(35,55): error TS7006: Parameter 'r' implicitly has an 'any' type.
12:20:00.431 ../../packages/lib/server-only/recipient/get-next-pending-recipient.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.431 ../../packages/lib/server-only/recipient/get-next-pending-recipient.ts(34,46): error TS7006: Parameter 'r' implicitly has an 'any' type.
12:20:00.431 ../../packages/lib/server-only/recipient/get-recipient-by-id.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.431 ../../packages/lib/server-only/recipient/get-recipient-by-id.ts(67,35): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.431 ../../packages/lib/server-only/recipient/get-recipient-suggestions.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.431 ../../packages/lib/server-only/recipient/get-recipient-suggestions.ts(25,28): error TS2339: Property 'QueryMode' does not exist on type 'typeof Prisma'.
12:20:00.431 ../../packages/lib/server-only/recipient/get-recipient-suggestions.ts(31,28): error TS2339: Property 'QueryMode' does not exist on type 'typeof Prisma'.
12:20:00.431 ../../packages/lib/server-only/recipient/get-recipient-suggestions.ts(93,8): error TS7006: Parameter 'member' implicitly has an 'any' type.
12:20:00.431 ../../packages/lib/server-only/recipient/get-recipient-suggestions.ts(93,37): error TS7006: Parameter 'r' implicitly has an 'any' type.
12:20:00.431 ../../packages/lib/server-only/recipient/get-recipients-for-assistant.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.431 ../../packages/lib/server-only/recipient/get-recipients-for-assistant.ts(52,32): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.431 ../../packages/lib/server-only/recipient/get-recipients-for-document.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.431 ../../packages/lib/server-only/recipient/set-document-recipients.ts(4,15): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.431 ../../packages/lib/server-only/recipient/set-document-recipients.ts(5,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.431 ../../packages/lib/server-only/recipient/set-document-recipients.ts(5,24): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.431 ../../packages/lib/server-only/recipient/set-document-recipients.ts(6,10): error TS2305: Module '"@prisma/client"' has no exported member 'SendStatus'.
12:20:00.431 ../../packages/lib/server-only/recipient/set-document-recipients.ts(6,22): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.431 ../../packages/lib/server-only/recipient/set-document-recipients.ts(123,6): error TS7006: Parameter 'existingRecipient' implicitly has an 'any' type.
12:20:00.431 ../../packages/lib/server-only/recipient/set-document-recipients.ts(129,8): error TS7006: Parameter 'existingRecipient' implicitly has an 'any' type.
12:20:00.431 ../../packages/lib/server-only/recipient/set-document-recipients.ts(152,64): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.431 ../../packages/lib/server-only/recipient/set-document-recipients.ts(267,38): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.431 ../../packages/lib/server-only/recipient/set-document-recipients.ts(271,40): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.431 ../../packages/lib/server-only/recipient/set-document-recipients.ts(277,38): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.431 ../../packages/lib/server-only/recipient/set-document-recipients.ts(299,36): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.431 ../../packages/lib/server-only/recipient/set-document-recipients.ts(340,86): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.431 ../../packages/lib/server-only/recipient/set-document-recipients.ts(342,8): error TS7006: Parameter 'removedRecipient' implicitly has an 'any' type.
12:20:00.431 ../../packages/lib/server-only/recipient/set-document-recipients.ts(345,8): error TS7006: Parameter 'persistedRecipient' implicitly has an 'any' type.
12:20:00.431 ../../packages/lib/server-only/recipient/set-template-recipients.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.431 ../../packages/lib/server-only/recipient/set-template-recipients.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.431 ../../packages/lib/server-only/recipient/set-template-recipients.ts(2,24): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.431 ../../packages/lib/server-only/recipient/set-template-recipients.ts(98,6): error TS7006: Parameter 'existingRecipient' implicitly has an 'any' type.
12:20:00.432 ../../packages/lib/server-only/recipient/set-template-recipients.ts(108,8): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.432 ../../packages/lib/server-only/recipient/set-template-recipients.ts(126,8): error TS7006: Parameter 'existingRecipient' implicitly has an 'any' type.
12:20:00.432 ../../packages/lib/server-only/recipient/set-template-recipients.ts(135,64): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.432 ../../packages/lib/server-only/recipient/set-template-recipients.ts(195,38): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.432 ../../packages/lib/server-only/recipient/set-template-recipients.ts(202,70): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.432 ../../packages/lib/server-only/recipient/set-template-recipients.ts(204,8): error TS7006: Parameter 'removedRecipient' implicitly has an 'any' type.
12:20:00.432 ../../packages/lib/server-only/recipient/set-template-recipients.ts(207,8): error TS7006: Parameter 'persistedRecipient' implicitly has an 'any' type.
12:20:00.432 ../../packages/lib/server-only/recipient/update-envelope-recipients.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.432 ../../packages/lib/server-only/recipient/update-envelope-recipients.ts(1,24): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.432 ../../packages/lib/server-only/recipient/update-envelope-recipients.ts(1,39): error TS2305: Module '"@prisma/client"' has no exported member 'SendStatus'.
12:20:00.432 ../../packages/lib/server-only/recipient/update-envelope-recipients.ts(1,51): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.432 ../../packages/lib/server-only/recipient/update-envelope-recipients.ts(96,8): error TS7006: Parameter 'existingRecipient' implicitly has an 'any' type.
12:20:00.432 ../../packages/lib/server-only/recipient/update-envelope-recipients.ts(117,62): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.432 ../../packages/lib/server-only/recipient/update-envelope-recipients.ts(199,40): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.432 ../../packages/lib/server-only/recipient/update-envelope-recipients.ts(202,37): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.432 ../../packages/lib/server-only/share/create-or-get-share-link.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.432 ../../packages/lib/server-only/share/create-or-get-share-link.ts(47,16): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.432 ../../packages/lib/server-only/share/create-or-get-share-link.ts(59,16): error TS7006: Parameter 'user' implicitly has an 'any' type.
12:20:00.432 ../../packages/lib/server-only/team/create-team-email-verification.ts(4,15): error TS2305: Module '"@prisma/client"' has no exported member 'Team'.
12:20:00.432 ../../packages/lib/server-only/team/create-team-email-verification.ts(56,14): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.432 ../../packages/lib/server-only/team/create-team-email-verification.ts(88,33): error TS2339: Property 'PrismaClientKnownRequestError' does not exist on type 'typeof Prisma'.
12:20:00.432 ../../packages/lib/server-only/team/create-team.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationGroupType'.
12:20:00.432 ../../packages/lib/server-only/team/create-team.ts(1,33): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberRole'.
12:20:00.432 ../../packages/lib/server-only/team/create-team.ts(1,57): error TS2305: Module '"@prisma/client"' has no exported member 'TeamMemberRole'.
12:20:00.432 ../../packages/lib/server-only/team/create-team.ts(105,14): error TS7006: Parameter 'group' implicitly has an 'any' type.
12:20:00.432 ../../packages/lib/server-only/team/create-team.ts(121,11): error TS7006: Parameter 'group' implicitly has an 'any' type.
12:20:00.432 ../../packages/lib/server-only/team/create-team.ts(131,10): error TS2349: This expression is not callable.
12:20:00.432 Type 'NonExhaustiveError<any>' has no call signatures.
12:20:00.432 ../../packages/lib/server-only/team/create-team.ts(136,14): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.432 ../../packages/lib/server-only/team/create-team.ts(153,55): error TS7006: Parameter 'group' implicitly has an 'any' type.
12:20:00.432 ../../packages/lib/server-only/team/create-team.ts(190,13): error TS7006: Parameter 'err' implicitly has an 'any' type.
12:20:00.432 ../../packages/lib/server-only/team/delete-team.ts(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationGroupType'.
12:20:00.432 ../../packages/lib/server-only/team/delete-team.ts(4,38): error TS2305: Module '"@prisma/client"' has no exported member 'Team'.
12:20:00.432 ../../packages/lib/server-only/team/delete-team.ts(71,30): error TS7006: Parameter 'group' implicitly has an 'any' type.
12:20:00.432 ../../packages/lib/server-only/team/delete-team.ts(72,61): error TS7006: Parameter 'member' implicitly has an 'any' type.
12:20:00.432 ../../packages/lib/server-only/team/delete-team.ts(82,12): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.432 ../../packages/lib/server-only/team/delete-team.ts(99,29): error TS2345: Argument of type '{ name: "send.team-deleted.email"; payload: { team: { name: any; url: any; }; members: any[] | [] | [any, ...any[]] | [unknown, ...unknown[]]; organisationId: any; }; }' is not assignable to parameter of type '{ id?: string | undefined; name: "send.signing.requested.email"; payload: { userId: number; documentId: number; recipientId: number; requestMetadata?: { ipAddress?: string | undefined; userAgent?: string | undefined; } | undefined; }; timestamp?: number | undefined; } | ... 11 more ... | { ...; }'.
12:20:00.432 The types of 'payload.members' are incompatible between these types.
12:20:00.432 Type 'any[] | [] | [any, ...any[]] | [unknown, ...unknown[]]' is not assignable to type '{ id: number; name: string; email: string; }[]'.
12:20:00.432 Type '[unknown, ...unknown[]]' is not assignable to type '{ id: number; name: string; email: string; }[]'.
12:20:00.432 Type 'unknown' is not assignable to type '{ id: number; name: string; email: string; }'.
12:20:00.432 ../../packages/lib/server-only/team/find-team-members.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMember'.
12:20:00.432 ../../packages/lib/server-only/team/find-team-members.ts(57,29): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'OrganisationMemberWhereInput'.
12:20:00.432 ../../packages/lib/server-only/team/find-team-members.ts(64,28): error TS2339: Property 'QueryMode' does not exist on type 'typeof Prisma'.
12:20:00.432 ../../packages/lib/server-only/team/find-team-members.ts(70,28): error TS2339: Property 'QueryMode' does not exist on type 'typeof Prisma'.
12:20:00.432 ../../packages/lib/server-only/team/find-team-members.ts(78,29): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'OrganisationMemberWhereInput'.
12:20:00.432 ../../packages/lib/server-only/team/find-team-members.ts(93,29): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'OrganisationMemberOrderByWithRelationInput'.
12:20:00.433 ../../packages/lib/server-only/team/find-team-members.ts(138,32): error TS7006: Parameter 'member' implicitly has an 'any' type.
12:20:00.433 ../../packages/lib/server-only/team/find-team-members.ts(147,50): error TS7031: Binding element 'group' implicitly has an 'any' type.
12:20:00.433 ../../packages/lib/server-only/team/find-team-members.ts(148,34): error TS7006: Parameter 'tg' implicitly has an 'any' type.
12:20:00.433 ../../packages/lib/server-only/team/find-team-members.ts(153,50): error TS7031: Binding element 'group' implicitly has an 'any' type.
12:20:00.433 ../../packages/lib/server-only/team/find-teams.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'Team'.
12:20:00.433 ../../packages/lib/server-only/team/find-teams.ts(32,29): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'TeamWhereInput'.
12:20:00.433 ../../packages/lib/server-only/team/find-teams.ts(54,20): error TS2339: Property 'QueryMode' does not exist on type 'typeof Prisma'.
12:20:00.433 ../../packages/lib/server-only/team/find-teams.ts(87,32): error TS7006: Parameter 'team' implicitly has an 'any' type.
12:20:00.433 ../../packages/lib/server-only/team/get-team-members.ts(55,42): error TS7006: Parameter 'member' implicitly has an 'any' type.
12:20:00.433 ../../packages/lib/server-only/team/get-team-members.ts(62,27): error TS7006: Parameter 'member' implicitly has an 'any' type.
12:20:00.433 ../../packages/lib/server-only/team/get-team-members.ts(63,63): error TS7006: Parameter 'group' implicitly has an 'any' type.
12:20:00.433 ../../packages/lib/server-only/team/get-team-members.ts(74,31): error TS7006: Parameter 'group' implicitly has an 'any' type.
12:20:00.433 ../../packages/lib/server-only/team/get-team-members.ts(74,66): error TS7006: Parameter 'tg' implicitly has an 'any' type.
12:20:00.433 ../../packages/lib/server-only/team/get-team-public-profile.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'TeamProfile'.
12:20:00.433 ../../packages/lib/server-only/team/get-teams.ts(4,32): error TS2307: Cannot find module '@signtusk/prisma/generated/types' or its corresponding type declarations.
12:20:00.433 ../../packages/lib/server-only/team/get-teams.ts(5,28): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/TeamSchema' or its corresponding type declarations.
12:20:00.433 ../../packages/lib/server-only/team/get-teams.ts(44,21): error TS7006: Parameter 'team' implicitly has an 'any' type.
12:20:00.433 ../../packages/lib/server-only/team/resend-team-email-verification.ts(39,12): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.433 ../../packages/lib/server-only/team/update-team.ts(56,33): error TS2339: Property 'PrismaClientKnownRequestError' does not exist on type 'typeof Prisma'.
12:20:00.433 ../../packages/lib/server-only/template/create-document-from-direct-template.ts(4,15): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.433 ../../packages/lib/server-only/template/create-document-from-direct-template.ts(4,22): error TS2305: Module '"@prisma/client"' has no exported member 'Signature'.
12:20:00.433 ../../packages/lib/server-only/template/create-document-from-direct-template.ts(6,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSigningOrder'.
12:20:00.433 ../../packages/lib/server-only/template/create-document-from-direct-template.ts(7,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSource'.
12:20:00.433 ../../packages/lib/server-only/template/create-document-from-direct-template.ts(8,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.433 ../../packages/lib/server-only/template/create-document-from-direct-template.ts(9,3): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.433 ../../packages/lib/server-only/template/create-document-from-direct-template.ts(10,3): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.433 ../../packages/lib/server-only/template/create-document-from-direct-template.ts(12,3): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.433 ../../packages/lib/server-only/template/create-document-from-direct-template.ts(13,3): error TS2305: Module '"@prisma/client"' has no exported member 'SendStatus'.
12:20:00.433 ../../packages/lib/server-only/template/create-document-from-direct-template.ts(14,3): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.433 ../../packages/lib/server-only/template/create-document-from-direct-template.ts(15,3): error TS2305: Module '"@prisma/client"' has no exported member 'WebhookTriggerEvents'.
12:20:00.433 ../../packages/lib/server-only/template/create-document-from-direct-template.ts(170,6): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.433 ../../packages/lib/server-only/template/create-document-from-direct-template.ts(206,6): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.433 ../../packages/lib/server-only/template/create-document-from-direct-template.ts(215,66): error TS7006: Parameter 'templateField' implicitly has an 'any' type.
12:20:00.433 ../../packages/lib/server-only/template/create-document-from-direct-template.ts(229,32): error TS7006: Parameter 'templateField' implicitly has an 'any' type.
12:20:00.433 ../../packages/lib/server-only/template/create-document-from-direct-template.ts(316,53): error TS7006: Parameter 'item' implicitly has an 'any' type.
12:20:00.433 ../../packages/lib/server-only/template/create-document-from-direct-template.ts(316,59): error TS7006: Parameter 'i' implicitly has an 'any' type.
12:20:00.433 ../../packages/lib/server-only/template/create-document-from-direct-template.ts(354,84): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.433 ../../packages/lib/server-only/template/create-document-from-direct-template.ts(383,52): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.433 ../../packages/lib/server-only/template/create-document-from-direct-template.ts(427,10): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.433 ../../packages/lib/server-only/template/create-document-from-direct-template.ts(427,44): error TS18046: 'templateRecipient' is of type 'unknown'.
12:20:00.433 ../../packages/lib/server-only/template/create-document-from-direct-template.ts(435,9): error TS18046: 'templateRecipient' is of type 'unknown'.
12:20:00.433 ../../packages/lib/server-only/template/create-document-from-direct-template.ts(435,39): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.433 ../../packages/lib/server-only/template/create-document-from-direct-template.ts(496,62): error TS2339: Property 'JsonNull' does not exist on type 'typeof Prisma'.
12:20:00.433 ../../packages/lib/server-only/template/create-document-from-direct-template.ts(529,60): error TS2339: Property 'JsonNull' does not exist on type 'typeof Prisma'.
12:20:00.433 ../../packages/lib/server-only/template/create-document-from-direct-template.ts(552,45): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.433 ../../packages/lib/server-only/template/create-document-from-direct-template.ts(749,40): error TS7006: Parameter 'attachment' implicitly has an 'any' type.
12:20:00.433 ../../packages/lib/server-only/template/create-document-from-template.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentDistributionMethod'.
12:20:00.433 ../../packages/lib/server-only/template/create-document-from-template.ts(1,43): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSigningOrder'.
12:20:00.434 ../../packages/lib/server-only/template/create-document-from-template.ts(3,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSource'.
12:20:00.434 ../../packages/lib/server-only/template/create-document-from-template.ts(4,3): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.434 ../../packages/lib/server-only/template/create-document-from-template.ts(5,8): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.434 ../../packages/lib/server-only/template/create-document-from-template.ts(6,3): error TS2305: Module '"@prisma/client"' has no exported member 'FolderType'.
12:20:00.434 ../../packages/lib/server-only/template/create-document-from-template.ts(7,8): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.445 ../../packages/lib/server-only/template/create-document-from-template.ts(8,3): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.445 ../../packages/lib/server-only/template/create-document-from-template.ts(9,3): error TS2305: Module '"@prisma/client"' has no exported member 'SendStatus'.
12:20:00.445 ../../packages/lib/server-only/template/create-document-from-template.ts(10,3): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.445 ../../packages/lib/server-only/template/create-document-from-template.ts(11,3): error TS2305: Module '"@prisma/client"' has no exported member 'WebhookTriggerEvents'.
12:20:00.445 ../../packages/lib/server-only/template/create-document-from-template.ts(370,8): error TS7006: Parameter 'templateRecipient' implicitly has an 'any' type.
12:20:00.445 ../../packages/lib/server-only/template/create-document-from-template.ts(384,70): error TS7006: Parameter 'templateRecipient' implicitly has an 'any' type.
12:20:00.445 ../../packages/lib/server-only/template/create-document-from-template.ts(406,39): error TS7006: Parameter 'item' implicitly has an 'any' type.
12:20:00.445 ../../packages/lib/server-only/template/create-document-from-template.ts(406,45): error TS7006: Parameter 'i' implicitly has an 'any' type.
12:20:00.445 ../../packages/lib/server-only/template/create-document-from-template.ts(489,43): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.445 ../../packages/lib/server-only/template/create-document-from-template.ts(600,51): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.445 ../../packages/lib/server-only/template/create-document-from-template.ts(687,35): error TS7006: Parameter 'attachment' implicitly has an 'any' type.
12:20:00.445 ../../packages/lib/server-only/template/create-template-direct-link.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.445 ../../packages/lib/server-only/template/create-template-direct-link.ts(1,29): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.445 ../../packages/lib/server-only/template/create-template-direct-link.ts(52,32): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.445 ../../packages/lib/server-only/template/create-template-direct-link.ts(60,8): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.445 ../../packages/lib/server-only/template/create-template-direct-link.ts(68,62): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.445 ../../packages/lib/server-only/template/delete-template-direct-link.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.445 ../../packages/lib/server-only/template/delete-template-direct-link.ts(50,36): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.445 ../../packages/lib/server-only/template/delete-template.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.445 ../../packages/lib/server-only/template/find-templates.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'TemplateType'.
12:20:00.445 ../../packages/lib/server-only/template/find-templates.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.445 ../../packages/lib/server-only/template/find-templates.ts(27,29): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'EnvelopeWhereInput'.
12:20:00.445 ../../packages/lib/server-only/template/get-template-by-direct-link-token.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.445 ../../packages/lib/server-only/template/get-template-by-direct-link-token.ts(48,63): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.445 ../../packages/lib/server-only/template/get-template-by-direct-link-token.ts(52,35): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.452 ../../packages/lib/server-only/template/get-template-by-direct-link-token.ts(89,49): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.453 ../../packages/lib/server-only/template/get-template-by-direct-link-token.ts(90,48): error TS7006: Parameter 'item' implicitly has an 'any' type.
12:20:00.453 ../../packages/lib/server-only/template/get-template-by-id.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.453 ../../packages/lib/server-only/template/get-template-by-id.ts(81,34): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.453 ../../packages/lib/server-only/template/get-template-by-id.ts(86,42): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.453 ../../packages/lib/server-only/template/get-template-by-id.ts(98,48): error TS7006: Parameter 'envelopeItem' implicitly has an 'any' type.
12:20:00.453 ../../packages/lib/server-only/template/toggle-template-direct-link.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.453 ../../packages/lib/server-only/user/create-user.ts(2,15): error TS2305: Module '"@prisma/client"' has no exported member 'User'.
12:20:00.453 ../../packages/lib/server-only/user/create-user.ts(30,49): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.453 ../../packages/lib/server-only/user/delete-user.ts(48,57): error TS7006: Parameter 'org' implicitly has an 'any' type.
12:20:00.453 ../../packages/lib/server-only/user/delete-user.ts(48,80): error TS7006: Parameter 'team' implicitly has an 'any' type.
12:20:00.453 ../../packages/lib/server-only/user/delete-user.ts(52,14): error TS7006: Parameter 'member' implicitly has an 'any' type.
12:20:00.453 ../../packages/lib/server-only/user/delete-user.ts(53,15): error TS7006: Parameter 'member' implicitly has an 'any' type.
12:20:00.453 ../../packages/lib/server-only/user/delete-user.ts(54,38): error TS7006: Parameter 'team' implicitly has an 'any' type.
12:20:00.453 ../../packages/lib/server-only/user/delete-user.ts(61,45): error TS7006: Parameter 'teamId' implicitly has an 'any' type.
12:20:00.453 ../../packages/lib/server-only/user/delete-user.ts(65,30): error TS7031: Binding element 'teamId' implicitly has an 'any' type.
12:20:00.453 ../../packages/lib/server-only/user/delete-user.ts(65,38): error TS7031: Binding element 'orgOwnerId' implicitly has an 'any' type.
12:20:00.453 ../../packages/lib/server-only/user/disable-user.ts(27,38): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.453 ../../packages/lib/server-only/user/find-user-security-audit-logs.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'UserSecurityAuditLog'.
12:20:00.453 ../../packages/lib/server-only/user/find-user-security-audit-logs.ts(1,37): error TS2305: Module '"@prisma/client"' has no exported member 'UserSecurityAuditLogType'.
12:20:00.453 ../../packages/lib/server-only/user/get-all-users.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.453 ../../packages/lib/server-only/user/get-all-users.ts(18,30): error TS2339: Property 'validator' does not exist on type 'typeof Prisma'.
12:20:00.453 ../../packages/lib/server-only/user/get-all-users.ts(18,47): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'UserWhereInput'.
12:20:00.453 ../../packages/lib/server-only/user/get-all-users.ts(62,23): error TS7006: Parameter 'user' implicitly has an 'any' type.
12:20:00.453 ../../packages/lib/server-only/user/reset-password.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'UserSecurityAuditLogType'.
12:20:00.453 ../../packages/lib/server-only/user/reset-password.ts(56,36): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.453 ../../packages/lib/server-only/user/update-password.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'UserSecurityAuditLogType'.
12:20:00.453 ../../packages/lib/server-only/user/update-password.ts(47,43): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.453 ../../packages/lib/server-only/user/update-profile.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'UserSecurityAuditLogType'.
12:20:00.453 ../../packages/lib/server-only/user/update-profile.ts(27,36): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.453 ../../packages/lib/server-only/webhooks/create-webhook.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'WebhookTriggerEvents'.
12:20:00.453 ../../packages/lib/server-only/webhooks/edit-webhook.ts(10,21): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'WebhookUpdateInput'.
12:20:00.453 ../../packages/lib/server-only/webhooks/get-all-webhooks-by-event-trigger.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'WebhookTriggerEvents'.
12:20:00.453 ../../packages/lib/server-only/webhooks/trigger-test-webhook.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'WebhookTriggerEvents'.
12:20:00.453 ../../packages/lib/server-only/webhooks/trigger/generate-sample-data.ts(2,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentDistributionMethod'.
12:20:00.453 ../../packages/lib/server-only/webhooks/trigger/generate-sample-data.ts(3,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSigningOrder'.
12:20:00.453 ../../packages/lib/server-only/webhooks/trigger/generate-sample-data.ts(4,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSource'.
12:20:00.453 ../../packages/lib/server-only/webhooks/trigger/generate-sample-data.ts(5,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.453 ../../packages/lib/server-only/webhooks/trigger/generate-sample-data.ts(6,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentVisibility'.
12:20:00.453 ../../packages/lib/server-only/webhooks/trigger/generate-sample-data.ts(7,3): error TS2305: Module '"@prisma/client"' has no exported member 'ReadStatus'.
12:20:00.453 ../../packages/lib/server-only/webhooks/trigger/generate-sample-data.ts(8,3): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.453 ../../packages/lib/server-only/webhooks/trigger/generate-sample-data.ts(9,3): error TS2305: Module '"@prisma/client"' has no exported member 'SendStatus'.
12:20:00.453 ../../packages/lib/server-only/webhooks/trigger/generate-sample-data.ts(10,3): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.453 ../../packages/lib/server-only/webhooks/trigger/generate-sample-data.ts(11,3): error TS2305: Module '"@prisma/client"' has no exported member 'WebhookTriggerEvents'.
12:20:00.453 ../../packages/lib/server-only/webhooks/trigger/handler.ts(43,67): error TS2322: Type 'unknown' is not assignable to type 'number'.
12:20:00.453 ../../packages/lib/server-only/webhooks/trigger/handler.ts(43,75): error TS2322: Type 'unknown' is not assignable to type 'number'.
12:20:00.453 ../../packages/lib/server-only/webhooks/trigger/handler.ts(46,28): error TS7006: Parameter 'webhook' implicitly has an 'any' type.
12:20:00.453 ../../packages/lib/server-only/webhooks/trigger/schema.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'WebhookTriggerEvents'.
12:20:00.453 ../../packages/lib/server-only/webhooks/trigger/trigger-webhook.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'WebhookTriggerEvents'.
12:20:00.453 ../../packages/lib/server-only/webhooks/trigger/trigger-webhook.ts(22,37): error TS7006: Parameter 'webhook' implicitly has an 'any' type.
12:20:00.453 ../../packages/lib/server-only/webhooks/zapier/list-documents.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.453 ../../packages/lib/server-only/webhooks/zapier/list-documents.ts(1,29): error TS2305: Module '"@prisma/client"' has no exported member 'Webhook'.
12:20:00.453 ../../packages/lib/server-only/webhooks/zapier/list-documents.ts(62,45): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.453 ../../packages/lib/types/document-audit-logs.ts(7,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSource'.
12:20:00.453 ../../packages/lib/types/document-audit-logs.ts(7,26): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.453 ../../packages/lib/types/document-email.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentMeta'.
12:20:00.453 ../../packages/lib/types/document-email.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentDistributionMethod'.
12:20:00.453 ../../packages/lib/types/document-meta.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentDistributionMethod'.
12:20:00.453 ../../packages/lib/types/document-meta.ts(2,38): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSigningOrder'.
12:20:00.453 ../../packages/lib/types/document-meta.ts(8,36): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/DocumentMetaSchema' or its corresponding type declarations.
12:20:00.453 ../../packages/lib/types/document-visibility.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentVisibility'.
12:20:00.453 ../../packages/lib/types/document.ts(3,36): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/DocumentDataSchema' or its corresponding type declarations.
12:20:00.453 ../../packages/lib/types/document.ts(4,36): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/DocumentMetaSchema' or its corresponding type declarations.
12:20:00.453 ../../packages/lib/types/document.ts(5,32): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/EnvelopeItemSchema' or its corresponding type declarations.
12:20:00.453 ../../packages/lib/types/document.ts(6,30): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/FolderSchema' or its corresponding type declarations.
12:20:00.453 ../../packages/lib/types/document.ts(7,28): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/TeamSchema' or its corresponding type declarations.
12:20:00.453 ../../packages/lib/types/document.ts(8,28): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/UserSchema' or its corresponding type declarations.
12:20:00.453 ../../packages/lib/types/email-domain.ts(3,35): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/EmailDomainSchema' or its corresponding type declarations.
12:20:00.453 ../../packages/lib/types/envelope.ts(3,36): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/DocumentMetaSchema' or its corresponding type declarations.
12:20:00.453 ../../packages/lib/types/envelope.ts(4,36): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/EnvelopeItemSchema' or its corresponding type declarations.
12:20:00.453 ../../packages/lib/types/envelope.ts(5,32): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/EnvelopeSchema' or its corresponding type declarations.
12:20:00.453 ../../packages/lib/types/envelope.ts(6,28): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/TeamSchema' or its corresponding type declarations.
12:20:00.453 ../../packages/lib/types/envelope.ts(7,38): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/TemplateDirectLinkSchema' or its corresponding type declarations.
12:20:00.453 ../../packages/lib/types/field-meta.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.453 ../../packages/lib/types/field.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.453 ../../packages/lib/types/field.ts(4,29): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/FieldSchema' or its corresponding type declarations.
12:20:00.453 ../../packages/lib/types/field.ts(104,50): error TS2339: Property 'Decimal' does not exist on type 'typeof Prisma'.
12:20:00.454 ../../packages/lib/types/field.ts(105,23): error TS2339: Property 'Decimal' does not exist on type 'typeof Prisma'.
12:20:00.454 ../../packages/lib/types/organisation-email.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EmailDomainStatus'.
12:20:00.454 ../../packages/lib/types/organisation-email.ts(4,41): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/OrganisationEmailSchema' or its corresponding type declarations.
12:20:00.454 ../../packages/lib/types/organisation.ts(3,37): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/OrganisationClaimSchema' or its corresponding type declarations.
12:20:00.454 ../../packages/lib/types/organisation.ts(4,36): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/OrganisationSchema' or its corresponding type declarations.
12:20:00.454 ../../packages/lib/types/recipient.ts(4,33): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/RecipientSchema' or its corresponding type declarations.
12:20:00.454 ../../packages/lib/types/recipient.ts(5,28): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/TeamSchema' or its corresponding type declarations.
12:20:00.454 ../../packages/lib/types/recipient.ts(6,28): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/UserSchema' or its corresponding type declarations.
12:20:00.454 ../../packages/lib/types/subscription.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'SubscriptionClaim'.
12:20:00.454 ../../packages/lib/types/template.ts(3,36): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/DocumentDataSchema' or its corresponding type declarations.
12:20:00.454 ../../packages/lib/types/template.ts(4,36): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/DocumentMetaSchema' or its corresponding type declarations.
12:20:00.454 ../../packages/lib/types/template.ts(5,32): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/EnvelopeItemSchema' or its corresponding type declarations.
12:20:00.454 ../../packages/lib/types/template.ts(6,30): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/FolderSchema' or its corresponding type declarations.
12:20:00.454 ../../packages/lib/types/template.ts(7,24): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/TeamSchema' or its corresponding type declarations.
12:20:00.454 ../../packages/lib/types/template.ts(8,28): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/UserSchema' or its corresponding type declarations.
12:20:00.454 ../../packages/lib/types/webhook-payload.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentMeta'.
12:20:00.454 ../../packages/lib/types/webhook-payload.ts(1,29): error TS2305: Module '"@prisma/client"' has no exported member 'Envelope'.
12:20:00.454 ../../packages/lib/types/webhook-payload.ts(1,39): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.454 ../../packages/lib/types/webhook-payload.ts(1,50): error TS2305: Module '"@prisma/client"' has no exported member 'WebhookTriggerEvents'.
12:20:00.454 ../../packages/lib/types/webhook-payload.ts(3,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentDistributionMethod'.
12:20:00.454 ../../packages/lib/types/webhook-payload.ts(4,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSigningOrder'.
12:20:00.454 ../../packages/lib/types/webhook-payload.ts(5,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSource'.
12:20:00.454 ../../packages/lib/types/webhook-payload.ts(6,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.454 ../../packages/lib/types/webhook-payload.ts(7,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentVisibility'.
12:20:00.454 ../../packages/lib/types/webhook-payload.ts(8,3): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.454 ../../packages/lib/types/webhook-payload.ts(9,3): error TS2305: Module '"@prisma/client"' has no exported member 'ReadStatus'.
12:20:00.454 ../../packages/lib/types/webhook-payload.ts(10,3): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.454 ../../packages/lib/types/webhook-payload.ts(11,3): error TS2305: Module '"@prisma/client"' has no exported member 'SendStatus'.
12:20:00.454 ../../packages/lib/types/webhook-payload.ts(12,3): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.454 ../../packages/lib/types/webhook-payload.ts(111,47): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.454 ../../packages/lib/universal/field-renderer/field-renderer.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.454 ../../packages/lib/universal/field-renderer/field-renderer.ts(1,26): error TS2305: Module '"@prisma/client"' has no exported member 'Signature'.
12:20:00.454 ../../packages/lib/universal/field-renderer/field-renderer.ts(2,15): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.454 ../../packages/lib/universal/field-renderer/render-dropdown-field.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.454 ../../packages/lib/universal/field-renderer/render-field.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'Signature'.
12:20:00.454 ../../packages/lib/universal/field-renderer/render-field.ts(2,15): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.454 ../../packages/lib/universal/field-renderer/render-field.ts(2,22): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.454 ../../packages/lib/universal/upload/get-file.server.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentDataType'.
12:20:00.454 ../../packages/lib/universal/upload/put-file.server.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentDataType'.
12:20:00.454 ../../packages/lib/universal/upload/put-file.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentDataType'.
12:20:00.454 ../../packages/lib/utils/advanced-fields-helpers.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.454 ../../packages/lib/utils/advanced-fields-helpers.ts(1,22): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.454 ../../packages/lib/utils/billing.ts(1,35): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/SubscriptionSchema' or its corresponding type declarations.
12:20:00.454 ../../packages/lib/utils/document-audit-logs.ts(3,15): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentAuditLog'.
12:20:00.454 ../../packages/lib/utils/document-audit-logs.ts(3,33): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentMeta'.
12:20:00.454 ../../packages/lib/utils/document-audit-logs.ts(3,47): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.454 ../../packages/lib/utils/document-audit-logs.ts(3,54): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.454 ../../packages/lib/utils/document-audit-logs.ts(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.454 ../../packages/lib/utils/document-auth.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'Envelope'.
12:20:00.454 ../../packages/lib/utils/document-auth.ts(1,25): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.454 ../../packages/lib/utils/document.ts(2,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentMeta'.
12:20:00.454 ../../packages/lib/utils/document.ts(3,3): error TS2305: Module '"@prisma/client"' has no exported member 'Envelope'.
12:20:00.454 ../../packages/lib/utils/document.ts(4,3): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationGlobalSettings'.
12:20:00.454 ../../packages/lib/utils/document.ts(5,3): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.454 ../../packages/lib/utils/document.ts(6,3): error TS2305: Module '"@prisma/client"' has no exported member 'Team'.
12:20:00.454 ../../packages/lib/utils/document.ts(7,3): error TS2305: Module '"@prisma/client"' has no exported member 'User'.
12:20:00.454 ../../packages/lib/utils/document.ts(9,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentDistributionMethod'.
12:20:00.454 ../../packages/lib/utils/document.ts(9,38): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSigningOrder'.
12:20:00.454 ../../packages/lib/utils/document.ts(9,60): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.454 ../../packages/lib/utils/document.ts(146,42): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.454 ../../packages/lib/utils/envelope-download.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeItem'.
12:20:00.454 ../../packages/lib/utils/envelope-signing.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.454 ../../packages/lib/utils/envelope-signing.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.454 ../../packages/lib/utils/envelope-signing.ts(175,41): error TS7006: Parameter 'valueIndex' implicitly has an 'any' type.
12:20:00.454 ../../packages/lib/utils/envelope-signing.ts(177,32): error TS7006: Parameter 'value' implicitly has an 'any' type.
12:20:00.454 ../../packages/lib/utils/fields.ts(3,15): error TS2305: Module '"@prisma/client"' has no exported member 'Envelope'.
12:20:00.454 ../../packages/lib/utils/fields.ts(3,30): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.454 ../../packages/lib/utils/fields.ts(3,37): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.454 ../../packages/lib/utils/is-admin.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'User'.
12:20:00.454 ../../packages/lib/utils/is-admin.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'Role'.
12:20:00.454 ../../packages/lib/utils/mask-recipient-tokens-for-document.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'User'.
12:20:00.454 ../../packages/lib/utils/mask-recipient-tokens-for-document.ts(16,53): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.454 ../../packages/lib/utils/organisations-claims.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'SubscriptionClaim'.
12:20:00.454 ../../packages/lib/utils/organisations.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'Organisation'.
12:20:00.454 ../../packages/lib/utils/organisations.ts(1,29): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationGlobalSettings'.
12:20:00.454 ../../packages/lib/utils/organisations.ts(3,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentVisibility'.
12:20:00.454 ../../packages/lib/utils/organisations.ts(4,8): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationGroup'.
12:20:00.454 ../../packages/lib/utils/organisations.ts(5,8): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberRole'.
12:20:00.454 ../../packages/lib/utils/organisations.ts(48,45): error TS7015: Element implicitly has an 'any' type because index expression is not of type 'number'.
12:20:00.455 ../../packages/lib/utils/organisations.ts(48,68): error TS7006: Parameter 'i' implicitly has an 'any' type.
12:20:00.455 ../../packages/lib/utils/organisations.ts(79,48): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'OrganisationWhereInput'.
12:20:00.456 ../../packages/lib/utils/recipient-formatter.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.456 ../../packages/lib/utils/recipients.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'Envelope'.
12:20:00.456 ../../packages/lib/utils/recipients.ts(2,15): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.456 ../../packages/lib/utils/recipients.ts(2,27): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.456 ../../packages/lib/utils/recipients.ts(2,38): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.456 ../../packages/lib/utils/recipients.ts(2,53): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.456 ../../packages/lib/utils/team-global-settings-to-branding.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationGlobalSettings'.
12:20:00.456 ../../packages/lib/utils/teams.ts(2,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentVisibility'.
12:20:00.456 ../../packages/lib/utils/teams.ts(3,3): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationGlobalSettings'.
12:20:00.456 ../../packages/lib/utils/teams.ts(5,3): error TS2305: Module '"@prisma/client"' has no exported member 'TeamGlobalSettings'.
12:20:00.456 ../../packages/lib/utils/teams.ts(8,32): error TS2307: Cannot find module '@signtusk/prisma/generated/types' or its corresponding type declarations.
12:20:00.456 ../../packages/lib/utils/teams.ts(9,37): error TS2307: Cannot find module '@signtusk/prisma/generated/types' or its corresponding type declarations.
12:20:00.456 ../../packages/lib/utils/teams.ts(80,37): error TS7015: Element implicitly has an 'any' type because index expression is not of type 'number'.
12:20:00.456 ../../packages/lib/utils/teams.ts(80,60): error TS7006: Parameter 'i' implicitly has an 'any' type.
12:20:00.456 ../../packages/lib/utils/teams.ts(136,40): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'TeamWhereUniqueInput'.
12:20:00.456 ../../packages/lib/utils/teams.ts(229,7): error TS2578: Unused '@ts-expect-error' directive.
12:20:00.456 ../../packages/lib/utils/templates.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'Envelope'.
12:20:00.456 ../../packages/lib/utils/templates.ts(2,15): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.456 ../../packages/pdf-processing/engines/certificate-generator.ts(1,25): error TS7016: Could not find a declaration file for module 'qrcode'. '/vercel/path0/node_modules/qrcode/lib/index.js' implicitly has an 'any' type.
12:20:00.456 Try `npm i --save-dev @types/qrcode` if it exists or add a new declaration (.d.ts) file containing `declare module 'qrcode';`
12:20:00.456 ../../packages/prisma/client.ts(3,5): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.456 ../../packages/prisma/client.ts(3,21): error TS2305: Module '"@prisma/client"' has no exported member 'EmailDomainStatus'.
12:20:00.456 ../../packages/prisma/client.ts(3,40): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.456 ../../packages/prisma/client.ts(5,5): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.456 ../../packages/prisma/client.ts(5,16): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberInviteStatus'.
12:20:00.456 ../../packages/prisma/client.ts(6,5): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationType'.
12:20:00.456 ../../packages/prisma/client.ts(6,45): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.456 ../../packages/prisma/client.ts(6,60): error TS2305: Module '"@prisma/client"' has no exported member 'SendStatus'.
12:20:00.456 ../../packages/prisma/client.ts(7,5): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.456 ../../packages/prisma/client.ts(7,20): error TS2305: Module '"@prisma/client"' has no exported member 'SubscriptionStatus'.
12:20:00.456 ../../packages/prisma/client.ts(8,5): error TS2305: Module '"@prisma/client"' has no exported member 'UserSecurityAuditLogType'.
12:20:00.456 ../../packages/prisma/client.ts(13,5): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentMeta'.
12:20:00.456 ../../packages/prisma/client.ts(14,5): error TS2305: Module '"@prisma/client"' has no exported member 'EmailDomain'.
12:20:00.456 ../../packages/prisma/client.ts(14,18): error TS2305: Module '"@prisma/client"' has no exported member 'Envelope'.
12:20:00.456 ../../packages/prisma/client.ts(14,28): error TS2305: Module '"@prisma/client"' has no exported member 'Organisation'.
12:20:00.456 ../../packages/prisma/client.ts(14,42): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationClaim'.
12:20:00.456 ../../packages/prisma/client.ts(14,61): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationEmail'.
12:20:00.456 ../../packages/prisma/client.ts(14,80): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationGlobalSettings'.
12:20:00.456 ../../packages/prisma/client.ts(14,108): error TS2305: Module '"@prisma/client"' has no exported member 'PrismaPromise'.
12:20:00.456 ../../packages/prisma/client.ts(14,123): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.456 ../../packages/prisma/client.ts(15,5): error TS2305: Module '"@prisma/client"' has no exported member 'User'.
12:20:00.456 ../../packages/prisma/guards/is-signature-field.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.456 ../../packages/prisma/index.ts(5,25): error TS2307: Cannot find module './generated/types' or its corresponding type declarations.
12:20:00.456 ../../packages/prisma/index.ts(80,29): error TS2307: Cannot find module './generated/types' or its corresponding type declarations.
12:20:00.456 ../../packages/prisma/types/document-legacy-schema.ts(5,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSource'.
12:20:00.456 ../../packages/prisma/types/document-legacy-schema.ts(11,34): error TS2307: Cannot find module '../generated/zod/inputTypeSchemas/DocumentStatusSchema' or its corresponding type declarations.
12:20:00.456 ../../packages/prisma/types/document-legacy-schema.ts(12,38): error TS2307: Cannot find module '../generated/zod/inputTypeSchemas/DocumentVisibilitySchema' or its corresponding type declarations.
12:20:00.456 ../../packages/prisma/types/document-with-recipient.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentData'.
12:20:00.456 ../../packages/prisma/types/document-with-recipient.ts(1,29): error TS2305: Module '"@prisma/client"' has no exported member 'Envelope'.
12:20:00.456 ../../packages/prisma/types/document-with-recipient.ts(1,39): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.456 ../../packages/prisma/types/extended-document-status.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.456 ../../packages/prisma/types/field-with-signature-and-fieldmeta.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.456 ../../packages/prisma/types/field-with-signature-and-fieldmeta.ts(1,22): error TS2305: Module '"@prisma/client"' has no exported member 'Signature'.
12:20:00.456 ../../packages/prisma/types/field-with-signature.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.456 ../../packages/prisma/types/field-with-signature.ts(1,22): error TS2305: Module '"@prisma/client"' has no exported member 'Signature'.
12:20:00.456 ../../packages/prisma/types/recipient-with-fields.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.456 ../../packages/prisma/types/recipient-with-fields.ts(1,22): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.456 ../../packages/prisma/types/template-legacy-schema.ts(5,10): error TS2305: Module '"@prisma/client"' has no exported member 'TemplateType'.
12:20:00.456 ../../packages/prisma/types/template-legacy-schema.ts(10,42): error TS2307: Cannot find module '../generated/zod/inputTypeSchemas/DocumentVisibilitySchema' or its corresponding type declarations.
12:20:00.456 ../../packages/prisma/types/template-legacy-schema.ts(11,38): error TS2307: Cannot find module '../generated/zod/modelSchema/TemplateDirectLinkSchema' or its corresponding type declarations.
12:20:00.456 ../../packages/trpc/server/admin-router/create-admin-organisation.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationType'.
12:20:00.456 ../../packages/trpc/server/admin-router/create-stripe-customer.ts(41,38): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.456 ../../packages/trpc/server/admin-router/find-admin-organisations.ts(42,27): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'OrganisationWhereInput'.
12:20:00.456 ../../packages/trpc/server/admin-router/find-admin-organisations.ts(50,26): error TS2339: Property 'QueryMode' does not exist on type 'typeof Prisma'.
12:20:00.456 ../../packages/trpc/server/admin-router/find-admin-organisations.ts(57,28): error TS2339: Property 'QueryMode' does not exist on type 'typeof Prisma'.
12:20:00.456 ../../packages/trpc/server/admin-router/find-admin-organisations.ts(64,26): error TS2339: Property 'QueryMode' does not exist on type 'typeof Prisma'.
12:20:00.456 ../../packages/trpc/server/admin-router/find-admin-organisations.ts(70,26): error TS2339: Property 'QueryMode' does not exist on type 'typeof Prisma'.
12:20:00.456 ../../packages/trpc/server/admin-router/find-admin-organisations.ts(82,24): error TS2339: Property 'QueryMode' does not exist on type 'typeof Prisma'.
12:20:00.456 ../../packages/trpc/server/admin-router/find-admin-organisations.ts(94,26): error TS2339: Property 'QueryMode' does not exist on type 'typeof Prisma'.
12:20:00.456 ../../packages/trpc/server/admin-router/find-admin-organisations.ts(100,26): error TS2339: Property 'QueryMode' does not exist on type 'typeof Prisma'.
12:20:00.457 ../../packages/trpc/server/admin-router/find-admin-organisations.types.ts(4,32): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/OrganisationSchema' or its corresponding type declarations.
12:20:00.457 ../../packages/trpc/server/admin-router/find-admin-organisations.types.ts(5,32): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/SubscriptionSchema' or its corresponding type declarations.
12:20:00.457 ../../packages/trpc/server/admin-router/find-admin-organisations.types.ts(6,24): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/UserSchema' or its corresponding type declarations.
12:20:00.457 ../../packages/trpc/server/admin-router/find-document-jobs.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.457 ../../packages/trpc/server/admin-router/find-document-jobs.types.ts(4,33): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/BackgroundJobSchema' or its corresponding type declarations.
12:20:00.457 ../../packages/trpc/server/admin-router/find-subscription-claims.ts(6,42): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/SubscriptionClaimSchema' or its corresponding type declarations.
12:20:00.457 ../../packages/trpc/server/admin-router/find-subscription-claims.ts(34,27): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'SubscriptionClaimWhereInput'.
12:20:00.457 ../../packages/trpc/server/admin-router/find-subscription-claims.types.ts(4,37): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/SubscriptionClaimSchema' or its corresponding type declarations.
12:20:00.457 ../../packages/trpc/server/admin-router/get-admin-organisation.types.ts(4,37): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/OrganisationClaimSchema' or its corresponding type declarations.
12:20:00.457 ../../packages/trpc/server/admin-router/get-admin-organisation.types.ts(5,46): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/OrganisationGlobalSettingsSchema' or its corresponding type declarations.
12:20:00.457 ../../packages/trpc/server/admin-router/get-admin-organisation.types.ts(6,43): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/OrganisationGroupMemberSchema' or its corresponding type declarations.
12:20:00.457 ../../packages/trpc/server/admin-router/get-admin-organisation.types.ts(7,37): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/OrganisationGroupSchema' or its corresponding type declarations.
12:20:00.457 ../../packages/trpc/server/admin-router/get-admin-organisation.types.ts(8,38): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/OrganisationMemberSchema' or its corresponding type declarations.
12:20:00.473 ../../packages/trpc/server/admin-router/get-admin-organisation.types.ts(9,32): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/SubscriptionSchema' or its corresponding type declarations.
12:20:00.474 ../../packages/trpc/server/admin-router/get-admin-organisation.types.ts(10,24): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/TeamSchema' or its corresponding type declarations.
12:20:00.474 ../../packages/trpc/server/admin-router/get-admin-organisation.types.ts(11,24): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/UserSchema' or its corresponding type declarations.
12:20:00.474 ../../packages/trpc/server/admin-router/get-user.types.ts(3,24): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/UserSchema' or its corresponding type declarations.
12:20:00.474 ../../packages/trpc/server/admin-router/promote-member-to-owner.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationGroupType'.
12:20:00.474 ../../packages/trpc/server/admin-router/promote-member-to-owner.ts(1,33): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberRole'.
12:20:00.474 ../../packages/trpc/server/admin-router/promote-member-to-owner.ts(77,48): error TS7006: Parameter 'member' implicitly has an 'any' type.
12:20:00.474 ../../packages/trpc/server/admin-router/promote-member-to-owner.ts(82,8): error TS7006: Parameter 'group' implicitly has an 'any' type.
12:20:00.474 ../../packages/trpc/server/admin-router/promote-member-to-owner.ts(86,8): error TS7006: Parameter 'group' implicitly has an 'any' type.
12:20:00.474 ../../packages/trpc/server/admin-router/promote-member-to-owner.ts(102,38): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.474 ../../packages/trpc/server/admin-router/reseal-document.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.474 ../../packages/trpc/server/admin-router/update-organisation-member-role.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationGroupType'.
12:20:00.474 ../../packages/trpc/server/admin-router/update-organisation-member-role.ts(1,33): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberRole'.
12:20:00.474 ../../packages/trpc/server/admin-router/update-organisation-member-role.ts(77,48): error TS7006: Parameter 'member' implicitly has an 'any' type.
12:20:00.474 ../../packages/trpc/server/admin-router/update-organisation-member-role.ts(88,10): error TS7006: Parameter 'group' implicitly has an 'any' type.
12:20:00.474 ../../packages/trpc/server/admin-router/update-organisation-member-role.ts(92,10): error TS7006: Parameter 'group' implicitly has an 'any' type.
12:20:00.474 ../../packages/trpc/server/admin-router/update-organisation-member-role.ts(121,40): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.474 ../../packages/trpc/server/admin-router/update-organisation-member-role.ts(169,8): error TS7006: Parameter 'group' implicitly has an 'any' type.
12:20:00.474 ../../packages/trpc/server/admin-router/update-organisation-member-role.ts(173,8): error TS7006: Parameter 'group' implicitly has an 'any' type.
12:20:00.474 ../../packages/trpc/server/admin-router/update-organisation-member-role.ts(202,38): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.474 ../../packages/trpc/server/admin-router/update-organisation-member-role.types.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberRole'.
12:20:00.474 ../../packages/trpc/server/admin-router/update-subscription-claim.ts(32,38): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.474 ../../packages/trpc/server/admin-router/update-user.types.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'Role'.
12:20:00.474 ../../packages/trpc/server/api-token-router/get-api-tokens.types.ts(3,28): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/ApiTokenSchema' or its corresponding type declarations.
12:20:00.474 ../../packages/trpc/server/auth-router/find-passkeys.types.ts(4,27): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/PasskeySchema' or its corresponding type declarations.
12:20:00.474 ../../packages/trpc/server/context.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'Session'.
12:20:00.474 ../../packages/trpc/server/document-router/access-auth-request-2fa-email.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.474 ../../packages/trpc/server/document-router/attachment/create-attachment.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.474 ../../packages/trpc/server/document-router/attachment/find-attachments.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.474 ../../packages/trpc/server/document-router/create-document-temporary.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentDataType'.
12:20:00.474 ../../packages/trpc/server/document-router/create-document-temporary.ts(1,28): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.474 ../../packages/trpc/server/document-router/create-document-temporary.ts(52,22): error TS18046: 'title' is of type 'unknown'.
12:20:00.474 ../../packages/trpc/server/document-router/create-document-temporary.ts(54,50): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string'.
12:20:00.474 ../../packages/trpc/server/document-router/create-document-temporary.ts(68,9): error TS2322: Type 'unknown' is not assignable to type 'string'.
12:20:00.474 ../../packages/trpc/server/document-router/create-document-temporary.ts(69,9): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.474 ../../packages/trpc/server/document-router/create-document-temporary.ts(71,9): error TS2322: Type 'unknown' is not assignable to type '("ACCOUNT" | "TWO_FACTOR_AUTH")[] | undefined'.
12:20:00.474 ../../packages/trpc/server/document-router/create-document-temporary.ts(72,9): error TS2322: Type 'unknown' is not assignable to type '("ACCOUNT" | "PASSKEY" | "TWO_FACTOR_AUTH" | "PASSWORD")[] | undefined'.
12:20:00.474 ../../packages/trpc/server/document-router/create-document-temporary.ts(73,40): error TS2339: Property 'map' does not exist on type '{}'.
12:20:00.474 ../../packages/trpc/server/document-router/create-document-temporary.ts(73,45): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.474 ../../packages/trpc/server/document-router/create-document-temporary.ts(75,49): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.474 ../../packages/trpc/server/document-router/create-document-temporary.ts(83,9): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.474 ../../packages/trpc/server/document-router/create-document-temporary.ts(91,7): error TS2322: Type 'unknown' is not assignable to type '{ label: string; data: string; type?: "link" | undefined; }[] | undefined'.
12:20:00.474 ../../packages/trpc/server/document-router/create-document-temporary.ts(93,9): error TS2698: Spread types may only be created from object types.
12:20:00.475 ../../packages/trpc/server/document-router/create-document-temporary.ts(94,30): error TS2339: Property 'emailSettings' does not exist on type '{}'.
12:20:00.475 ../../packages/trpc/server/document-router/create-document-temporary.ts(130,45): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.475 ../../packages/trpc/server/document-router/create-document-temporary.ts(135,53): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.475 ../../packages/trpc/server/document-router/create-document.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.475 ../../packages/trpc/server/document-router/create-document.ts(45,9): error TS2322: Type '{}' is not assignable to type 'Record<string, string | number | boolean>'.
12:20:00.475 Index signature for type 'string' is missing in type '{}'.
12:20:00.475 ../../packages/trpc/server/document-router/create-document.ts(76,9): error TS2322: Type 'unknown' is not assignable to type 'string'.
12:20:00.475 ../../packages/trpc/server/document-router/create-document.ts(77,9): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.475 ../../packages/trpc/server/document-router/create-document.ts(79,9): error TS2322: Type 'unknown' is not assignable to type '("ACCOUNT" | "TWO_FACTOR_AUTH")[] | undefined'.
12:20:00.475 ../../packages/trpc/server/document-router/create-document.ts(80,9): error TS2322: Type 'unknown' is not assignable to type '("ACCOUNT" | "PASSKEY" | "TWO_FACTOR_AUTH" | "PASSWORD")[] | undefined'.
12:20:00.475 ../../packages/trpc/server/document-router/create-document.ts(81,40): error TS2339: Property 'map' does not exist on type '{}'.
12:20:00.475 ../../packages/trpc/server/document-router/create-document.ts(81,45): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.475 ../../packages/trpc/server/document-router/create-document.ts(83,49): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.475 ../../packages/trpc/server/document-router/create-document.ts(91,9): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.475 ../../packages/trpc/server/document-router/create-document.ts(99,7): error TS2322: Type 'unknown' is not assignable to type '{ label: string; data: string; type?: "link" | undefined; }[] | undefined'.
12:20:00.475 ../../packages/trpc/server/document-router/create-document.ts(101,9): error TS2698: Spread types may only be created from object types.
12:20:00.475 ../../packages/trpc/server/document-router/create-document.ts(102,30): error TS2339: Property 'emailSettings' does not exist on type '{}'.
12:20:00.475 ../../packages/trpc/server/document-router/distribute-document.ts(34,9): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.475 ../../packages/trpc/server/document-router/distribute-document.ts(35,9): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.475 ../../packages/trpc/server/document-router/distribute-document.ts(36,9): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.475 ../../packages/trpc/server/document-router/distribute-document.ts(37,9): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.475 ../../packages/trpc/server/document-router/distribute-document.ts(38,9): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.475 ../../packages/trpc/server/document-router/distribute-document.ts(40,9): error TS2322: Type '{} | undefined' is not assignable to type '{ recipientSigningRequest: boolean; recipientRemoved: boolean; recipientSigned: boolean; documentPending: boolean; documentCompleted: boolean; documentDeleted: boolean; ownerDocumentCompleted: boolean; } | undefined'.
12:20:00.475 Type '{}' is missing the following properties from type '{ recipientSigningRequest: boolean; recipientRemoved: boolean; recipientSigned: boolean; documentPending: boolean; documentCompleted: boolean; documentDeleted: boolean; ownerDocumentCompleted: boolean; }': recipientSigningRequest, recipientRemoved, recipientSigned, documentPending, and 3 more.
12:20:00.475 ../../packages/trpc/server/document-router/distribute-document.ts(41,9): error TS2322: Type 'unknown' is not assignable to type '"de" | "en" | "fr" | "es" | "it" | "nl" | "pl" | "pt-BR" | "ja" | "ko" | "zh" | undefined'.
12:20:00.475 ../../packages/trpc/server/document-router/distribute-document.ts(42,9): error TS2322: Type 'unknown' is not assignable to type 'string | null | undefined'.
12:20:00.475 ../../packages/trpc/server/document-router/distribute-document.ts(43,9): error TS2322: Type 'unknown' is not assignable to type 'string | null | undefined'.
12:20:00.475 ../../packages/trpc/server/document-router/download-document-audit-logs.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.475 ../../packages/trpc/server/document-router/download-document-beta.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentData'.
12:20:00.475 ../../packages/trpc/server/document-router/download-document-beta.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentDataType'.
12:20:00.475 ../../packages/trpc/server/document-router/download-document-beta.ts(2,28): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.475 ../../packages/trpc/server/document-router/download-document-certificate.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.475 ../../packages/trpc/server/document-router/find-documents-internal.ts(35,7): error TS2322: Type 'unknown' is not assignable to type 'PeriodSelectorValue | undefined'.
12:20:00.475 ../../packages/trpc/server/document-router/find-documents-internal.ts(36,7): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.475 ../../packages/trpc/server/document-router/find-documents-internal.ts(37,7): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.475 ../../packages/trpc/server/document-router/find-documents-internal.ts(46,9): error TS2322: Type 'unknown' is not assignable to type 'number[] | undefined'.
12:20:00.475 ../../packages/trpc/server/document-router/find-documents-internal.ts(58,9): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.475 ../../packages/trpc/server/document-router/find-documents-internal.ts(59,9): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.475 ../../packages/trpc/server/document-router/find-documents-internal.ts(60,9): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.475 ../../packages/trpc/server/document-router/find-documents-internal.ts(61,9): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.475 ../../packages/trpc/server/document-router/find-documents-internal.ts(64,9): error TS2322: Type 'unknown' is not assignable to type 'PeriodSelectorValue | undefined'.
12:20:00.475 ../../packages/trpc/server/document-router/find-documents-internal.ts(65,9): error TS2322: Type 'unknown' is not assignable to type 'number[] | undefined'.
12:20:00.475 ../../packages/trpc/server/document-router/find-documents-internal.ts(66,9): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.475 ../../packages/trpc/server/document-router/find-documents-internal.ts(67,9): error TS2322: Type '{ column: {}; direction: unknown; } | undefined' is not assignable to type '{ column: "createdAt"; direction: "desc" | "asc"; } | undefined'.
12:20:00.475 Type '{ column: {}; direction: unknown; }' is not assignable to type '{ column: "createdAt"; direction: "desc" | "asc"; }'.
12:20:00.475 Types of property 'column' are incompatible.
12:20:00.475 Type '{}' is not assignable to type '"createdAt"'.
12:20:00.476 ../../packages/trpc/server/document-router/find-documents-internal.ts(73,33): error TS7006: Parameter 'envelope' implicitly has an 'any' type.
12:20:00.476 ../../packages/trpc/server/document-router/find-documents.ts(33,7): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.476 ../../packages/trpc/server/document-router/find-documents.ts(34,7): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.476 ../../packages/trpc/server/document-router/find-documents.ts(37,7): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.476 ../../packages/trpc/server/document-router/find-documents.ts(38,7): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.476 ../../packages/trpc/server/document-router/find-documents.ts(39,7): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.476 ../../packages/trpc/server/document-router/find-documents.ts(40,7): error TS2322: Type '{ column: {}; direction: unknown; } | undefined' is not assignable to type '{ column: "createdAt"; direction: "desc" | "asc"; } | undefined'.
12:20:00.476 Type '{ column: {}; direction: unknown; }' is not assignable to type '{ column: "createdAt"; direction: "desc" | "asc"; }'.
12:20:00.476 Types of property 'column' are incompatible.
12:20:00.476 Type '{}' is not assignable to type '"createdAt"'.
12:20:00.476 ../../packages/trpc/server/document-router/find-documents.ts(45,33): error TS7006: Parameter 'envelope' implicitly has an 'any' type.
12:20:00.476 ../../packages/trpc/server/document-router/find-documents.types.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSource'.
12:20:00.476 ../../packages/trpc/server/document-router/find-documents.types.ts(1,26): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.476 ../../packages/trpc/server/document-router/find-inbox.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'Envelope'.
12:20:00.476 ../../packages/trpc/server/document-router/find-inbox.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.476 ../../packages/trpc/server/document-router/find-inbox.ts(2,26): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.476 ../../packages/trpc/server/document-router/find-inbox.ts(2,40): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.476 ../../packages/trpc/server/document-router/find-inbox.ts(56,29): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'EnvelopeWhereInput'.
12:20:00.476 ../../packages/trpc/server/document-router/find-inbox.ts(110,32): error TS7006: Parameter 'document' implicitly has an 'any' type.
12:20:00.476 ../../packages/trpc/server/document-router/get-document-by-token.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.476 ../../packages/trpc/server/document-router/get-document-by-token.types.ts(3,32): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/DocumentDataSchema' or its corresponding type declarations.
12:20:00.476 ../../packages/trpc/server/document-router/get-inbox-count.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.476 ../../packages/trpc/server/document-router/get-inbox-count.ts(1,26): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.476 ../../packages/trpc/server/document-router/get-inbox-count.ts(1,40): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.476 ../../packages/trpc/server/document-router/get-inbox-count.types.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'ReadStatus'.
12:20:00.484 ../../packages/trpc/server/document-router/schema.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentVisibility'.
12:20:00.484 ../../packages/trpc/server/document-router/share-document.types.ts(3,37): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/DocumentShareLinkSchema' or its corresponding type declarations.
12:20:00.484 ../../packages/trpc/server/document-router/update-document.ts(37,7): error TS2322: Type '{ [x: string]: any; title?: unknown; externalId?: unknown; visibility?: unknown; globalAccessAuth?: unknown; globalActionAuth?: unknown; useLegacyFieldInsertion?: unknown; folderId?: unknown; } | undefined' is not assignable to type '{ title?: string | undefined; folderId?: string | null | undefined; externalId?: string | null | undefined; visibility?: any; globalAccessAuth?: ("ACCOUNT" | "TWO_FACTOR_AUTH")[] | undefined; ... 4 more ...; useLegacyFieldInsertion?: boolean | undefined; } | undefined'.
12:20:00.484 Type '{ [x: string]: any; title?: unknown; externalId?: unknown; visibility?: unknown; globalAccessAuth?: unknown; globalActionAuth?: unknown; useLegacyFieldInsertion?: unknown; folderId?: unknown; }' is not assignable to type '{ title?: string | undefined; folderId?: string | null | undefined; externalId?: string | null | undefined; visibility?: any; globalAccessAuth?: ("ACCOUNT" | "TWO_FACTOR_AUTH")[] | undefined; ... 4 more ...; useLegacyFieldInsertion?: boolean | undefined; }'.
12:20:00.484 Types of property 'title' are incompatible.
12:20:00.484 Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.484 ../../packages/trpc/server/embedding-router/create-embedding-document.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.484 ../../packages/trpc/server/embedding-router/create-embedding-document.ts(42,11): error TS2322: Type '{ fields: any; id?: unknown; email?: unknown; name?: unknown; role?: unknown; signingOrder?: unknown; }[]' is not assignable to type 'CreateEnvelopeRecipientOptions[]'.
12:20:00.484 Type '{ fields: any; id?: unknown; email?: unknown; name?: unknown; role?: unknown; signingOrder?: unknown; }' is not assignable to type 'CreateEnvelopeRecipientOptions'.
12:20:00.484 Types of property 'email' are incompatible.
12:20:00.484 Type 'unknown' is not assignable to type 'string'.
12:20:00.484 ../../packages/trpc/server/embedding-router/create-embedding-document.ts(44,46): error TS2339: Property 'map' does not exist on type '{}'.
12:20:00.484 ../../packages/trpc/server/embedding-router/create-embedding-document.ts(44,51): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.484 ../../packages/trpc/server/embedding-router/create-embedding-document.types.ts(25,38): error TS2307: Cannot find module '@signtusk/prisma/generated/types' or its corresponding type declarations.
12:20:00.484 ../../packages/trpc/server/embedding-router/create-embedding-template.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.484 ../../packages/trpc/server/embedding-router/create-embedding-template.ts(73,26): error TS2339: Property 'map' does not exist on type '{}'.
12:20:00.484 ../../packages/trpc/server/embedding-router/create-embedding-template.ts(73,31): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.484 ../../packages/trpc/server/embedding-router/create-embedding-template.types.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSigningOrder'.
12:20:00.484 ../../packages/trpc/server/embedding-router/create-embedding-template.types.ts(1,32): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.484 ../../packages/trpc/server/embedding-router/get-multi-sign-document.ts(43,45): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.485 ../../packages/trpc/server/embedding-router/get-multi-sign-document.types.ts(5,32): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/DocumentDataSchema' or its corresponding type declarations.
12:20:00.485 ../../packages/trpc/server/embedding-router/get-multi-sign-document.types.ts(6,32): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/DocumentMetaSchema' or its corresponding type declarations.
12:20:00.485 ../../packages/trpc/server/embedding-router/get-multi-sign-document.types.ts(7,32): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/EnvelopeItemSchema' or its corresponding type declarations.
12:20:00.485 ../../packages/trpc/server/embedding-router/get-multi-sign-document.types.ts(8,25): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/FieldSchema' or its corresponding type declarations.
12:20:00.485 ../../packages/trpc/server/embedding-router/get-multi-sign-document.types.ts(9,29): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/SignatureSchema' or its corresponding type declarations.
12:20:00.486 ../../packages/trpc/server/embedding-router/update-embedding-document.ts(71,9): error TS2322: Type '{ id: unknown; clientId: string; email: unknown; name: {}; role: unknown; signingOrder: unknown; }[]' is not assignable to type 'RecipientData[]'.
12:20:00.486 Type '{ id: unknown; clientId: string; email: unknown; name: {}; role: unknown; signingOrder: unknown; }' is not assignable to type 'RecipientData'.
12:20:00.486 Types of property 'id' are incompatible.
12:20:00.486 Type 'unknown' is not assignable to type 'number | null | undefined'.
12:20:00.486 ../../packages/trpc/server/embedding-router/update-embedding-document.ts(91,41): error TS2339: Property 'map' does not exist on type '{}'.
12:20:00.486 ../../packages/trpc/server/embedding-router/update-embedding-document.ts(91,46): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.486 ../../packages/trpc/server/embedding-router/update-embedding-document.types.ts(24,53): error TS2307: Cannot find module '@signtusk/prisma/generated/types' or its corresponding type declarations.
12:20:00.486 ../../packages/trpc/server/embedding-router/update-embedding-template.ts(65,9): error TS2322: Type '{ id: unknown; email: unknown; name: {}; role: {}; signingOrder: unknown; }[]' is not assignable to type '{ id?: number | undefined; email: string; name: string; role: RecipientRole; signingOrder?: number | null | undefined; actionAuth?: ("ACCOUNT" | "PASSKEY" | "TWO_FACTOR_AUTH" | "PASSWORD" | "EXPLICIT_NONE")[] | undefined; }[]'.
12:20:00.486 Type '{ id: unknown; email: unknown; name: {}; role: {}; signingOrder: unknown; }' is not assignable to type '{ id?: number | undefined; email: string; name: string; role: RecipientRole; signingOrder?: number | null | undefined; actionAuth?: ("ACCOUNT" | "PASSKEY" | "TWO_FACTOR_AUTH" | "PASSWORD" | "EXPLICIT_NONE")[] | undefined; }'.
12:20:00.486 Types of property 'id' are incompatible.
12:20:00.486 Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.486 ../../packages/trpc/server/embedding-router/update-embedding-template.ts(83,41): error TS2339: Property 'map' does not exist on type '{}'.
12:20:00.486 ../../packages/trpc/server/embedding-router/update-embedding-template.ts(83,46): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.486 ../../packages/trpc/server/embedding-router/update-embedding-template.types.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSigningOrder'.
12:20:00.486 ../../packages/trpc/server/embedding-router/update-embedding-template.types.ts(1,32): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.486 ../../packages/trpc/server/enterprise-router/find-organisation-email-domain.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'EmailDomainStatus'.
12:20:00.486 ../../packages/trpc/server/enterprise-router/find-organisation-email-domain.ts(66,29): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'EmailDomainWhereInput'.
12:20:00.486 ../../packages/trpc/server/enterprise-router/find-organisation-email-domain.ts(78,20): error TS2339: Property 'QueryMode' does not exist on type 'typeof Prisma'.
12:20:00.486 ../../packages/trpc/server/enterprise-router/find-organisation-email-domain.ts(110,32): error TS7006: Parameter 'item' implicitly has an 'any' type.
12:20:00.486 ../../packages/trpc/server/enterprise-router/find-organisation-email-domain.types.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EmailDomainStatus'.
12:20:00.486 ../../packages/trpc/server/enterprise-router/find-organisation-emails.ts(62,29): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'OrganisationEmailWhereInput'.
12:20:00.486 ../../packages/trpc/server/enterprise-router/find-organisation-emails.ts(70,20): error TS2339: Property 'QueryMode' does not exist on type 'typeof Prisma'.
12:20:00.486 ../../packages/trpc/server/enterprise-router/get-organisation-authentication-portal.types.ts(3,56): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/OrganisationAuthenticationPortalSchema' or its corresponding type declarations.
12:20:00.486 ../../packages/trpc/server/enterprise-router/manage-subscription.ts(68,17): error TS7006: Parameter 'err' implicitly has an 'any' type.
12:20:00.486 ../../packages/trpc/server/enterprise-router/update-organisation-authentication-portal.ts(79,9): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.486 ../../packages/trpc/server/enterprise-router/update-organisation-authentication-portal.ts(91,9): error TS2322: Type '{}' is not assignable to type 'string'.
12:20:00.486 ../../packages/trpc/server/enterprise-router/update-organisation-authentication-portal.types.ts(3,42): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/inputTypeSchemas/OrganisationMemberRoleSchema' or its corresponding type declarations.
12:20:00.486 ../../packages/trpc/server/enterprise-router/verify-organisation-email-domain.ts(50,62): error TS7006: Parameter 'email' implicitly has an 'any' type.
12:20:00.486 ../../packages/trpc/server/enterprise-router/verify-organisation-email-domain.ts(58,49): error TS7006: Parameter 'email' implicitly has an 'any' type.
12:20:00.486 ../../packages/trpc/server/envelope-router/create-envelope-items.ts(102,53): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.486 ../../packages/trpc/server/envelope-router/create-envelope-items.ts(117,33): error TS7006: Parameter 'item' implicitly has an 'any' type.
12:20:00.486 ../../packages/trpc/server/envelope-router/create-envelope-items.types.ts(4,32): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/EnvelopeItemSchema' or its corresponding type declarations.
12:20:00.486 ../../packages/trpc/server/envelope-router/create-envelope.ts(78,13): error TS2322: Type '{}' is not assignable to type 'Record<string, string | number | boolean>'.
12:20:00.486 Index signature for type 'string' is missing in type '{}'.
12:20:00.486 ../../packages/trpc/server/envelope-router/create-envelope.ts(95,44): error TS2339: Property 'map' does not exist on type '{}'.
12:20:00.486 ../../packages/trpc/server/envelope-router/create-envelope.ts(95,49): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.486 ../../packages/trpc/server/envelope-router/create-envelope.ts(102,38): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.486 ../../packages/trpc/server/envelope-router/create-envelope.ts(138,9): error TS2322: Type 'unknown' is not assignable to type 'string'.
12:20:00.486 ../../packages/trpc/server/envelope-router/create-envelope.ts(139,9): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.486 ../../packages/trpc/server/envelope-router/create-envelope.ts(140,9): error TS2322: Type 'unknown' is not assignable to type 'Record<string, string | number | boolean> | undefined'.
12:20:00.486 ../../packages/trpc/server/envelope-router/create-envelope.ts(142,9): error TS2322: Type 'unknown' is not assignable to type '("ACCOUNT" | "TWO_FACTOR_AUTH")[] | undefined'.
12:20:00.486 ../../packages/trpc/server/envelope-router/create-envelope.ts(143,9): error TS2322: Type 'unknown' is not assignable to type '("ACCOUNT" | "PASSKEY" | "TWO_FACTOR_AUTH" | "PASSWORD")[] | undefined'.
12:20:00.486 ../../packages/trpc/server/envelope-router/create-envelope.ts(145,9): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.486 ../../packages/trpc/server/envelope-router/create-envelope.ts(148,7): error TS2322: Type 'unknown' is not assignable to type '{ label: string; data: string; type?: "link" | undefined; }[] | undefined'.
12:20:00.486 ../../packages/trpc/server/envelope-router/create-envelope.ts(149,7): error TS2322: Type 'unknown' is not assignable to type 'Partial<Omit<DocumentMeta, "id">> | undefined'.
12:20:00.486 ../../packages/trpc/server/envelope-router/create-envelope.types.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.486 ../../packages/trpc/server/envelope-router/delete-envelope-item.ts(60,53): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.486 ../../packages/trpc/server/envelope-router/delete-envelope.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.487 ../../packages/trpc/server/envelope-router/delete-envelope.ts(68,8): error TS2349: This expression is not callable.
12:20:00.487 Type 'NonExhaustiveError<any>' has no call signatures.
12:20:00.487 ../../packages/trpc/server/envelope-router/distribute-envelope.ts(34,9): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.487 ../../packages/trpc/server/envelope-router/distribute-envelope.ts(35,9): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.487 ../../packages/trpc/server/envelope-router/distribute-envelope.ts(36,9): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.487 ../../packages/trpc/server/envelope-router/distribute-envelope.ts(37,9): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.487 ../../packages/trpc/server/envelope-router/distribute-envelope.ts(38,9): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.487 ../../packages/trpc/server/envelope-router/distribute-envelope.ts(40,9): error TS2322: Type '{} | undefined' is not assignable to type '{ recipientSigningRequest: boolean; recipientRemoved: boolean; recipientSigned: boolean; documentPending: boolean; documentCompleted: boolean; documentDeleted: boolean; ownerDocumentCompleted: boolean; } | undefined'.
12:20:00.487 Type '{}' is missing the following properties from type '{ recipientSigningRequest: boolean; recipientRemoved: boolean; recipientSigned: boolean; documentPending: boolean; documentCompleted: boolean; documentDeleted: boolean; ownerDocumentCompleted: boolean; }': recipientSigningRequest, recipientRemoved, recipientSigned, documentPending, and 3 more.
12:20:00.487 ../../packages/trpc/server/envelope-router/distribute-envelope.ts(41,9): error TS2322: Type 'unknown' is not assignable to type '"de" | "en" | "fr" | "es" | "it" | "nl" | "pl" | "pt-BR" | "ja" | "ko" | "zh" | undefined'.
12:20:00.487 ../../packages/trpc/server/envelope-router/distribute-envelope.ts(42,9): error TS2322: Type 'unknown' is not assignable to type 'string | null | undefined'.
12:20:00.487 ../../packages/trpc/server/envelope-router/distribute-envelope.ts(43,9): error TS2322: Type 'unknown' is not assignable to type 'string | null | undefined'.
12:20:00.487 ../../packages/trpc/server/envelope-router/distribute-envelope.ts(61,44): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.487 ../../packages/trpc/server/envelope-router/envelope-fields/delete-envelope-field.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.487 ../../packages/trpc/server/envelope-router/envelope-fields/delete-envelope-field.ts(68,60): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.487 ../../packages/trpc/server/envelope-router/envelope-fields/delete-envelope-field.ts(69,30): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.487 ../../packages/trpc/server/envelope-router/envelope-fields/delete-envelope-field.ts(71,61): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.487 ../../packages/trpc/server/envelope-router/envelope-fields/delete-envelope-field.ts(92,38): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.487 ../../packages/trpc/server/envelope-router/envelope-fields/update-envelope-fields.ts(32,7): error TS2322: Type '(({ [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | ... 5 more...' is not assignable to type '{ id: number; type?: any; pageNumber?: number | undefined; envelopeItemId?: string | undefined; pageX?: number | undefined; pageY?: number | undefined; width?: number | undefined; height?: number | undefined; fieldMeta?: { ...; } | ... 9 more ... | undefined; }[]'.
12:20:00.487 Type '({ [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | ... 5 more ...' is not assignable to type '{ id: number; type?: any; pageNumber?: number | undefined; envelopeItemId?: string | undefined; pageX?: number | undefined; pageY?: number | undefined; width?: number | undefined; height?: number | undefined; fieldMeta?: { ...; } | ... 9 more ... | undefined; }'.
12:20:00.487 Type '{ [x: string]: any; type?: unknown; fieldMeta?: unknown; } & { id: number; width?: number | undefined; height?: number | undefined; page?: number | undefined; positionX?: number | undefined; positionY?: number | undefined; envelopeItemId?: string | undefined; }' is not assignable to type '{ id: number; type?: any; pageNumber?: number | undefined; envelopeItemId?: string | undefined; pageX?: number | undefined; pageY?: number | undefined; width?: number | undefined; height?: number | undefined; fieldMeta?: { ...; } | ... 9 more ... | undefined; }'.
12:20:00.487 Types of property 'fieldMeta' are incompatible.
12:20:00.487 Type 'unknown' is not assignable to type '{ type: "initials"; label?: string | undefined; placeholder?: string | undefined; required?: boolean | undefined; readOnly?: boolean | undefined; fontSize?: number | undefined; textAlign?: "left" | ... 2 more ... | undefined; } | ... 9 more ... | undefined'.
12:20:00.487 ../../packages/trpc/server/envelope-router/envelope-recipients/create-envelope-recipients.ts(31,7): error TS2322: Type '{ [x: string]: any; email?: unknown; name?: unknown; role?: unknown; signingOrder?: unknown; accessAuth?: unknown; actionAuth?: unknown; }[]' is not assignable to type '{ email: string; name: string; role: RecipientRole; signingOrder?: number | null | undefined; accessAuth?: ("ACCOUNT" | "TWO_FACTOR_AUTH")[] | undefined; actionAuth?: ("ACCOUNT" | "PASSKEY" | "TWO_FACTOR_AUTH" | "PASSWORD" | "EXPLICIT_NONE")[] | undefined; }[]'.
12:20:00.487 Type '{ [x: string]: any; email?: unknown; name?: unknown; role?: unknown; signingOrder?: unknown; accessAuth?: unknown; actionAuth?: unknown; }' is not assignable to type '{ email: string; name: string; role: RecipientRole; signingOrder?: number | null | undefined; accessAuth?: ("ACCOUNT" | "TWO_FACTOR_AUTH")[] | undefined; actionAuth?: ("ACCOUNT" | "PASSKEY" | "TWO_FACTOR_AUTH" | "PASSWORD" | "EXPLICIT_NONE")[] | undefined; }'.
12:20:00.487 Types of property 'email' are incompatible.
12:20:00.487 Type 'unknown' is not assignable to type 'string'.
12:20:00.487 ../../packages/trpc/server/envelope-router/envelope-recipients/create-envelope-recipients.types.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.487 ../../packages/trpc/server/envelope-router/envelope-recipients/update-envelope-recipients.ts(31,7): error TS2322: Type '{ [x: string]: any; id?: unknown; email?: unknown; name?: unknown; role?: unknown; signingOrder?: unknown; accessAuth?: unknown; actionAuth?: unknown; }[]' is not assignable to type '{ id: number; email?: string | undefined; name?: string | undefined; role?: any; signingOrder?: number | null | undefined; accessAuth?: ("ACCOUNT" | "TWO_FACTOR_AUTH")[] | undefined; actionAuth?: ("ACCOUNT" | ... 3 more ... | "EXPLICIT_NONE")[] | undefined; }[]'.
12:20:00.487 Type '{ [x: string]: any; id?: unknown; email?: unknown; name?: unknown; role?: unknown; signingOrder?: unknown; accessAuth?: unknown; actionAuth?: unknown; }' is not assignable to type '{ id: number; email?: string | undefined; name?: string | undefined; role?: any; signingOrder?: number | null | undefined; accessAuth?: ("ACCOUNT" | "TWO_FACTOR_AUTH")[] | undefined; actionAuth?: ("ACCOUNT" | ... 3 more ... | "EXPLICIT_NONE")[] | undefined; }'.
12:20:00.487 Types of property 'id' are incompatible.
12:20:00.487 Type 'unknown' is not assignable to type 'number'.
12:20:00.487 ../../packages/trpc/server/envelope-router/envelope-recipients/update-envelope-recipients.types.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.487 ../../packages/trpc/server/envelope-router/find-envelope-audit-logs.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.487 ../../packages/trpc/server/envelope-router/find-envelope-audit-logs.ts(74,34): error TS7006: Parameter 'auditLog' implicitly has an 'any' type.
12:20:00.487 ../../packages/trpc/server/envelope-router/get-envelope-items-by-token.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.487 ../../packages/trpc/server/envelope-router/get-envelope-items-by-token.types.ts(3,32): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/EnvelopeItemSchema' or its corresponding type declarations.
12:20:00.487 ../../packages/trpc/server/envelope-router/get-envelope-items.types.ts(3,32): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/DocumentDataSchema' or its corresponding type declarations.
12:20:00.487 ../../packages/trpc/server/envelope-router/get-envelope-items.types.ts(4,32): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/EnvelopeItemSchema' or its corresponding type declarations.
12:20:00.487 ../../packages/trpc/server/envelope-router/redistribute-envelope.ts(40,44): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.487 ../../packages/trpc/server/envelope-router/schema.ts(3,29): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/RecipientSchema' or its corresponding type declarations.
12:20:00.487 ../../packages/trpc/server/envelope-router/set-envelope-fields.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.487 ../../packages/trpc/server/envelope-router/set-envelope-fields.ts(34,13): error TS2322: Type 'unknown' is not assignable to type 'string | number'.
12:20:00.487 ../../packages/trpc/server/envelope-router/set-envelope-fields.ts(36,19): error TS18046: 'fields' is of type 'unknown'.
12:20:00.488 ../../packages/trpc/server/envelope-router/set-envelope-fields.ts(36,31): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.488 ../../packages/trpc/server/envelope-router/set-envelope-fields.ts(53,13): error TS2322: Type 'unknown' is not assignable to type 'string | number'.
12:20:00.488 ../../packages/trpc/server/envelope-router/set-envelope-fields.ts(55,19): error TS18046: 'fields' is of type 'unknown'.
12:20:00.488 ../../packages/trpc/server/envelope-router/set-envelope-fields.ts(55,31): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.488 ../../packages/trpc/server/envelope-router/set-envelope-fields.ts(65,8): error TS2349: This expression is not callable.
12:20:00.488 Type 'NonExhaustiveError<unknown>' has no call signatures.
12:20:00.488 ../../packages/trpc/server/envelope-router/set-envelope-fields.ts(68,32): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.488 ../../packages/trpc/server/envelope-router/set-envelope-fields.types.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.488 ../../packages/trpc/server/envelope-router/set-envelope-fields.types.ts(1,24): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.488 ../../packages/trpc/server/envelope-router/set-envelope-recipients.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.488 ../../packages/trpc/server/envelope-router/set-envelope-recipients.ts(33,13): error TS2322: Type 'unknown' is not assignable to type 'string | number'.
12:20:00.488 ../../packages/trpc/server/envelope-router/set-envelope-recipients.ts(35,11): error TS2322: Type 'unknown' is not assignable to type 'RecipientData[]'.
12:20:00.488 ../../packages/trpc/server/envelope-router/set-envelope-recipients.ts(45,13): error TS2322: Type 'unknown' is not assignable to type 'string | number'.
12:20:00.488 ../../packages/trpc/server/envelope-router/set-envelope-recipients.ts(47,11): error TS2322: Type 'unknown' is not assignable to type '{ id?: number | undefined; email: string; name: string; role: RecipientRole; signingOrder?: number | null | undefined; actionAuth?: ("ACCOUNT" | "PASSKEY" | "TWO_FACTOR_AUTH" | "PASSWORD" | "EXPLICIT_NONE")[] | undefined; }[]'.
12:20:00.488 ../../packages/trpc/server/envelope-router/set-envelope-recipients.ts(50,8): error TS2349: This expression is not callable.
12:20:00.488 Type 'NonExhaustiveError<unknown>' has no call signatures.
12:20:00.488 ../../packages/trpc/server/envelope-router/set-envelope-recipients.types.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.488 ../../packages/trpc/server/envelope-router/set-envelope-recipients.types.ts(1,24): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.488 ../../packages/trpc/server/envelope-router/sign-envelope-field.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.488 ../../packages/trpc/server/envelope-router/sign-envelope-field.ts(1,26): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.488 ../../packages/trpc/server/envelope-router/sign-envelope-field.ts(1,37): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.488 ../../packages/trpc/server/envelope-router/sign-envelope-field.ts(1,52): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.489 ../../packages/trpc/server/envelope-router/sign-envelope-field.ts(138,47): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.489 ../../packages/trpc/server/envelope-router/sign-envelope-field.ts(200,40): error TS2345: Argument of type '{}' is not assignable to parameter of type 'string'.
12:20:00.489 ../../packages/trpc/server/envelope-router/sign-envelope-field.ts(202,9): error TS2322: Type '{} | null' is not assignable to type 'string | null'.
12:20:00.489 Type '{}' is not assignable to type 'string'.
12:20:00.489 ../../packages/trpc/server/envelope-router/sign-envelope-field.ts(203,9): error TS2322: Type '{} | null' is not assignable to type 'string | null'.
12:20:00.490 Type '{}' is not assignable to type 'string'.
12:20:00.490 ../../packages/trpc/server/envelope-router/sign-envelope-field.ts(207,45): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.490 ../../packages/trpc/server/envelope-router/sign-envelope-field.ts(288,16): error TS2349: This expression is not callable.
12:20:00.490 Type 'NonExhaustiveError<any>' has no call signatures.
12:20:00.490 ../../packages/trpc/server/envelope-router/sign-envelope-field.types.ts(6,29): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/SignatureSchema' or its corresponding type declarations.
12:20:00.490 ../../packages/trpc/server/envelope-router/signing-status-envelope.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.490 ../../packages/trpc/server/envelope-router/signing-status-envelope.ts(1,26): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.490 ../../packages/trpc/server/envelope-router/signing-status-envelope.ts(1,40): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.490 ../../packages/trpc/server/envelope-router/signing-status-envelope.ts(1,55): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.490 ../../packages/trpc/server/envelope-router/signing-status-envelope.ts(67,33): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.490 ../../packages/trpc/server/envelope-router/signing-status-envelope.ts(69,10): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.495 ../../packages/trpc/server/envelope-router/update-envelope-items.ts(65,38): error TS7031: Binding element 'id' implicitly has an 'any' type.
12:20:00.495 ../../packages/trpc/server/envelope-router/update-envelope-items.types.ts(3,32): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/EnvelopeItemSchema' or its corresponding type declarations.
12:20:00.495 ../../packages/trpc/server/envelope-router/update-envelope.ts(33,7): error TS2322: Type '{ [x: string]: any; title?: unknown; externalId?: unknown; visibility?: unknown; globalAccessAuth?: unknown; globalActionAuth?: unknown; folderId?: unknown; } | undefined' is not assignable to type '{ title?: string | undefined; folderId?: string | null | undefined; externalId?: string | null | undefined; visibility?: any; globalAccessAuth?: ("ACCOUNT" | "TWO_FACTOR_AUTH")[] | undefined; ... 4 more ...; useLegacyFieldInsertion?: boolean | undefined; } | undefined'.
12:20:00.495 Type '{ [x: string]: any; title?: unknown; externalId?: unknown; visibility?: unknown; globalAccessAuth?: unknown; globalActionAuth?: unknown; folderId?: unknown; }' is not assignable to type '{ title?: string | undefined; folderId?: string | null | undefined; externalId?: string | null | undefined; visibility?: any; globalAccessAuth?: ("ACCOUNT" | "TWO_FACTOR_AUTH")[] | undefined; ... 4 more ...; useLegacyFieldInsertion?: boolean | undefined; }'.
12:20:00.495 Types of property 'title' are incompatible.
12:20:00.495 Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.495 ../../packages/trpc/server/envelope-router/use-envelope.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.495 ../../packages/trpc/server/envelope-router/use-envelope.ts(118,10): error TS7006: Parameter 'item' implicitly has an 'any' type.
12:20:00.495 ../../packages/trpc/server/envelope-router/use-envelope.ts(147,7): error TS2322: Type '{ [x: string]: any; title?: unknown; subject?: unknown; message?: unknown; timezone?: unknown; dateFormat?: unknown; redirectUrl?: unknown; distributionMethod?: unknown; emailSettings?: unknown; language?: unknown; typedSignatureEnabled?: unknown; uploadSignatureEnabled?: unknown; drawSignatureEnabled?: unknown; all...' is not assignable to type '{ title?: string | undefined; subject?: string | undefined; message?: string | undefined; timezone?: string | undefined; password?: string | undefined; dateFormat?: string | undefined; ... 8 more ...; drawSignatureEnabled?: boolean | undefined; } | undefined'.
12:20:00.495 Type '{ [x: string]: any; title?: unknown; subject?: unknown; message?: unknown; timezone?: unknown; dateFormat?: unknown; redirectUrl?: unknown; distributionMethod?: unknown; emailSettings?: unknown; language?: unknown; typedSignatureEnabled?: unknown; uploadSignatureEnabled?: unknown; drawSignatureEnabled?: unknown; all...' is not assignable to type '{ title?: string | undefined; subject?: string | undefined; message?: string | undefined; timezone?: string | undefined; password?: string | undefined; dateFormat?: string | undefined; ... 8 more ...; drawSignatureEnabled?: boolean | undefined; }'.
12:20:00.495 Types of property 'title' are incompatible.
12:20:00.495 Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.495 ../../packages/trpc/server/envelope-router/use-envelope.ts(170,51): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.495 ../../packages/trpc/server/field-router/router.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.495 ../../packages/trpc/server/field-router/router.ts(200,18): error TS2322: Type '({ [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | ... 5 more ...' is not assignable to type '{ id: number; type?: any; pageNumber?: number | undefined; envelopeItemId?: string | undefined; pageX?: number | undefined; pageY?: number | undefined; width?: number | undefined; height?: number | undefined; fieldMeta?: { ...; } | ... 9 more ... | undefined; }'.
12:20:00.495 Type '{ [x: string]: any; type?: unknown; fieldMeta?: unknown; } & { id: number; width?: number | undefined; height?: number | undefined; pageNumber?: number | undefined; pageX?: number | undefined; pageY?: number | undefined; }' is not assignable to type '{ id: number; type?: any; pageNumber?: number | undefined; envelopeItemId?: string | undefined; pageX?: number | undefined; pageY?: number | undefined; width?: number | undefined; height?: number | undefined; fieldMeta?: { ...; } | ... 9 more ... | undefined; }'.
12:20:00.495 Types of property 'fieldMeta' are incompatible.
12:20:00.495 Type 'unknown' is not assignable to type '{ type: "initials"; label?: string | undefined; placeholder?: string | undefined; required?: boolean | undefined; readOnly?: boolean | undefined; fontSize?: number | undefined; textAlign?: "left" | ... 2 more ... | undefined; } | ... 9 more ... | undefined'.
12:20:00.495 ../../packages/trpc/server/field-router/router.ts(240,9): error TS2322: Type '(({ [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | ... 5 more...' is not assignable to type '{ id: number; type?: any; pageNumber?: number | undefined; envelopeItemId?: string | undefined; pageX?: number | undefined; pageY?: number | undefined; width?: number | undefined; height?: number | undefined; fieldMeta?: { ...; } | ... 9 more ... | undefined; }[]'.
12:20:00.495 Type '({ [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | ... 5 more ...' is not assignable to type '{ id: number; type?: any; pageNumber?: number | undefined; envelopeItemId?: string | undefined; pageX?: number | undefined; pageY?: number | undefined; width?: number | undefined; height?: number | undefined; fieldMeta?: { ...; } | ... 9 more ... | undefined; }'.
12:20:00.495 Type '{ [x: string]: any; type?: unknown; fieldMeta?: unknown; } & { id: number; width?: number | undefined; height?: number | undefined; pageNumber?: number | undefined; pageX?: number | undefined; pageY?: number | undefined; }' is not assignable to type '{ id: number; type?: any; pageNumber?: number | undefined; envelopeItemId?: string | undefined; pageX?: number | undefined; pageY?: number | undefined; width?: number | undefined; height?: number | undefined; fieldMeta?: { ...; } | ... 9 more ... | undefined; }'.
12:20:00.495 Types of property 'fieldMeta' are incompatible.
12:20:00.495 Type 'unknown' is not assignable to type '{ type: "initials"; label?: string | undefined; placeholder?: string | undefined; required?: boolean | undefined; readOnly?: boolean | undefined; fontSize?: number | undefined; textAlign?: "left" | ... 2 more ... | undefined; } | ... 9 more ... | undefined'.
12:20:00.495 ../../packages/trpc/server/field-router/router.ts(302,9): error TS2322: Type '{ id: unknown; recipientId: unknown; envelopeItemId: unknown; type: unknown; pageNumber: unknown; pageX: unknown; pageY: unknown; pageWidth: unknown; pageHeight: unknown; fieldMeta: unknown; }[]' is not assignable to type 'FieldData[]'.
12:20:00.500 Type '{ id: unknown; recipientId: unknown; envelopeItemId: unknown; type: unknown; pageNumber: unknown; pageX: unknown; pageY: unknown; pageWidth: unknown; pageHeight: unknown; fieldMeta: unknown; }' is not assignable to type 'FieldData'.
12:20:00.500 Types of property 'id' are incompatible.
12:20:00.500 Type 'unknown' is not assignable to type 'number | null | undefined'.
12:20:00.500 ../../packages/trpc/server/field-router/router.ts(473,18): error TS2322: Type '({ [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | ... 5 more ...' is not assignable to type '{ id: number; type?: any; pageNumber?: number | undefined; envelopeItemId?: string | undefined; pageX?: number | undefined; pageY?: number | undefined; width?: number | undefined; height?: number | undefined; fieldMeta?: { ...; } | ... 9 more ... | undefined; }'.
12:20:00.500 Type '{ [x: string]: any; type?: unknown; fieldMeta?: unknown; } & { id: number; width?: number | undefined; height?: number | undefined; pageNumber?: number | undefined; pageX?: number | undefined; pageY?: number | undefined; }' is not assignable to type '{ id: number; type?: any; pageNumber?: number | undefined; envelopeItemId?: string | undefined; pageX?: number | undefined; pageY?: number | undefined; width?: number | undefined; height?: number | undefined; fieldMeta?: { ...; } | ... 9 more ... | undefined; }'.
12:20:00.500 Types of property 'fieldMeta' are incompatible.
12:20:00.500 Type 'unknown' is not assignable to type '{ type: "initials"; label?: string | undefined; placeholder?: string | undefined; required?: boolean | undefined; readOnly?: boolean | undefined; fontSize?: number | undefined; textAlign?: "left" | ... 2 more ... | undefined; } | ... 9 more ... | undefined'.
12:20:00.500 ../../packages/trpc/server/field-router/router.ts(513,9): error TS2322: Type '(({ [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | ... 5 more...' is not assignable to type '{ id: number; type?: any; pageNumber?: number | undefined; envelopeItemId?: string | undefined; pageX?: number | undefined; pageY?: number | undefined; width?: number | undefined; height?: number | undefined; fieldMeta?: { ...; } | ... 9 more ... | undefined; }[]'.
12:20:00.501 Type '({ [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | { [x: string]: any; type?: unknown; fieldMeta?: unknown; } | ... 5 more ...' is not assignable to type '{ id: number; type?: any; pageNumber?: number | undefined; envelopeItemId?: string | undefined; pageX?: number | undefined; pageY?: number | undefined; width?: number | undefined; height?: number | undefined; fieldMeta?: { ...; } | ... 9 more ... | undefined; }'.
12:20:00.501 Type '{ [x: string]: any; type?: unknown; fieldMeta?: unknown; } & { id: number; width?: number | undefined; height?: number | undefined; pageNumber?: number | undefined; pageX?: number | undefined; pageY?: number | undefined; }' is not assignable to type '{ id: number; type?: any; pageNumber?: number | undefined; envelopeItemId?: string | undefined; pageX?: number | undefined; pageY?: number | undefined; width?: number | undefined; height?: number | undefined; fieldMeta?: { ...; } | ... 9 more ... | undefined; }'.
12:20:00.501 Types of property 'fieldMeta' are incompatible.
12:20:00.501 Type 'unknown' is not assignable to type '{ type: "initials"; label?: string | undefined; placeholder?: string | undefined; required?: boolean | undefined; readOnly?: boolean | undefined; fontSize?: number | undefined; textAlign?: "left" | ... 2 more ... | undefined; } | ... 9 more ... | undefined'.
12:20:00.501 ../../packages/trpc/server/field-router/router.ts(574,9): error TS2322: Type '{ id: unknown; recipientId: unknown; envelopeItemId: unknown; type: unknown; pageNumber: unknown; pageX: unknown; pageY: unknown; pageWidth: unknown; pageHeight: unknown; fieldMeta: unknown; }[]' is not assignable to type '{ id?: number | null | undefined; formId?: string | undefined; envelopeItemId: string; type: FieldType; recipientId: number; pageNumber: number; pageX: number; pageY: number; pageWidth: number; pageHeight: number; fieldMeta?: { ...; } | ... 9 more ... | undefined; }[]'.
12:20:00.501 Type '{ id: unknown; recipientId: unknown; envelopeItemId: unknown; type: unknown; pageNumber: unknown; pageX: unknown; pageY: unknown; pageWidth: unknown; pageHeight: unknown; fieldMeta: unknown; }' is not assignable to type '{ id?: number | null | undefined; formId?: string | undefined; envelopeItemId: string; type: FieldType; recipientId: number; pageNumber: number; pageX: number; pageY: number; pageWidth: number; pageHeight: number; fieldMeta?: { ...; } | ... 9 more ... | undefined; }'.
12:20:00.501 Types of property 'id' are incompatible.
12:20:00.501 Type 'unknown' is not assignable to type 'number | null | undefined'.
12:20:00.501 ../../packages/trpc/server/field-router/schema.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.501 ../../packages/trpc/server/folder-router/router.ts(224,9): error TS2322: Type '{ [x: string]: any; name?: unknown; parentId?: unknown; visibility?: unknown; pinned?: unknown; }' is not assignable to type '{ parentId?: string | null | undefined; name?: string | undefined; visibility?: any; pinned?: boolean | undefined; }'.
12:20:00.501 Types of property 'parentId' are incompatible.
12:20:00.501 Type 'unknown' is not assignable to type 'string | null | undefined'.
12:20:00.501 ../../packages/trpc/server/folder-router/schema.ts(5,36): error TS2307: Cannot find module '@signtusk/prisma/generated/types' or its corresponding type declarations.
12:20:00.501 ../../packages/trpc/server/folder-router/schema.ts(6,26): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/FolderSchema' or its corresponding type declarations.
12:20:00.501 ../../packages/trpc/server/organisation-router/create-organisation-group.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationGroupType'.
12:20:00.501 ../../packages/trpc/server/organisation-router/create-organisation-group.ts(35,9): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.501 ../../packages/trpc/server/organisation-router/create-organisation-group.ts(60,7): error TS2322: Type 'unknown' is not assignable to type 'string'.
12:20:00.501 ../../packages/trpc/server/organisation-router/create-organisation-group.ts(67,77): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string | number | symbol'.
12:20:00.501 ../../packages/trpc/server/organisation-router/create-organisation-group.ts(74,5): error TS18046: 'memberIds' is of type 'unknown'.
12:20:00.501 ../../packages/trpc/server/organisation-router/create-organisation-group.ts(74,24): error TS7006: Parameter 'memberId' implicitly has an 'any' type.
12:20:00.501 ../../packages/trpc/server/organisation-router/create-organisation-group.ts(75,51): error TS7031: Binding element 'id' implicitly has an 'any' type.
12:20:00.501 ../../packages/trpc/server/organisation-router/create-organisation-group.ts(82,38): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.501 ../../packages/trpc/server/organisation-router/create-organisation-group.ts(94,15): error TS18046: 'memberIds' is of type 'unknown'.
12:20:00.501 ../../packages/trpc/server/organisation-router/create-organisation-group.ts(94,30): error TS7006: Parameter 'memberId' implicitly has an 'any' type.
12:20:00.501 ../../packages/trpc/server/organisation-router/create-organisation-group.types.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberRole'.
12:20:00.501 ../../packages/trpc/server/organisation-router/create-organisation-member-invites.types.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberRole'.
12:20:00.501 ../../packages/trpc/server/organisation-router/create-organisation.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationType'.
12:20:00.501 ../../packages/trpc/server/organisation-router/decline-organisation-member-invite.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberInviteStatus'.
12:20:00.501 ../../packages/trpc/server/organisation-router/delete-organisation-group.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationGroupType'.
12:20:00.501 ../../packages/trpc/server/organisation-router/delete-organisation-members.ts(81,56): error TS7006: Parameter 'member' implicitly has an 'any' type.
12:20:00.501 ../../packages/trpc/server/organisation-router/delete-organisation-members.ts(94,36): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.501 ../../packages/trpc/server/organisation-router/delete-organisation.ts(58,53): error TS7006: Parameter 'team' implicitly has an 'any' type.
12:20:00.501 ../../packages/trpc/server/organisation-router/delete-organisation.ts(60,38): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.501 ../../packages/trpc/server/organisation-router/find-organisation-groups.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationGroupType'.
12:20:00.501 ../../packages/trpc/server/organisation-router/find-organisation-groups.ts(1,38): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberRole'.
12:20:00.509 ../../packages/trpc/server/organisation-router/find-organisation-groups.ts(71,29): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'OrganisationGroupWhereInput'.
12:20:00.509 ../../packages/trpc/server/organisation-router/find-organisation-groups.ts(91,20): error TS2339: Property 'QueryMode' does not exist on type 'typeof Prisma'.
12:20:00.509 ../../packages/trpc/server/organisation-router/find-organisation-groups.ts(146,32): error TS7006: Parameter 'group' implicitly has an 'any' type.
12:20:00.509 ../../packages/trpc/server/organisation-router/find-organisation-groups.ts(148,34): error TS7006: Parameter 'teamGroup' implicitly has an 'any' type.
12:20:00.509 ../../packages/trpc/server/organisation-router/find-organisation-groups.ts(154,52): error TS7031: Binding element 'organisationMember' implicitly has an 'any' type.
12:20:00.509 ../../packages/trpc/server/organisation-router/find-organisation-groups.types.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationGroupType'.
12:20:00.509 ../../packages/trpc/server/organisation-router/find-organisation-groups.types.ts(1,33): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberRole'.
12:20:00.509 ../../packages/trpc/server/organisation-router/find-organisation-groups.types.ts(1,57): error TS2305: Module '"@prisma/client"' has no exported member 'TeamMemberRole'.
12:20:00.509 ../../packages/trpc/server/organisation-router/find-organisation-groups.types.ts(5,41): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/OrganisationGroupSchema' or its corresponding type declarations.
12:20:00.509 ../../packages/trpc/server/organisation-router/find-organisation-member-invites.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberInviteStatus'.
12:20:00.509 ../../packages/trpc/server/organisation-router/find-organisation-member-invites.ts(32,7): error TS2322: Type 'unknown' is not assignable to type 'string'.
12:20:00.509 ../../packages/trpc/server/organisation-router/find-organisation-member-invites.ts(33,7): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.510 ../../packages/trpc/server/organisation-router/find-organisation-member-invites.ts(34,7): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.510 ../../packages/trpc/server/organisation-router/find-organisation-member-invites.ts(35,7): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.510 ../../packages/trpc/server/organisation-router/find-organisation-member-invites.ts(69,29): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'OrganisationMemberInviteWhereInput'.
12:20:00.510 ../../packages/trpc/server/organisation-router/find-organisation-member-invites.ts(77,20): error TS2339: Property 'QueryMode' does not exist on type 'typeof Prisma'.
12:20:00.510 ../../packages/trpc/server/organisation-router/find-organisation-member-invites.types.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberInviteStatus'.
12:20:00.510 ../../packages/trpc/server/organisation-router/find-organisation-member-invites.types.ts(5,48): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/OrganisationMemberInviteSchema' or its corresponding type declarations.
12:20:00.510 ../../packages/trpc/server/organisation-router/find-organisation-members.ts(35,43): error TS7006: Parameter 'organisationMember' implicitly has an 'any' type.
12:20:00.510 ../../packages/trpc/server/organisation-router/find-organisation-members.ts(36,73): error TS7006: Parameter 'group' implicitly has an 'any' type.
12:20:00.510 ../../packages/trpc/server/organisation-router/find-organisation-members.ts(75,29): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'OrganisationMemberWhereInput'.
12:20:00.510 ../../packages/trpc/server/organisation-router/find-organisation-members.ts(85,26): error TS2339: Property 'QueryMode' does not exist on type 'typeof Prisma'.
12:20:00.510 ../../packages/trpc/server/organisation-router/find-organisation-members.ts(91,26): error TS2339: Property 'QueryMode' does not exist on type 'typeof Prisma'.
12:20:00.510 ../../packages/trpc/server/organisation-router/find-organisation-members.types.ts(4,42): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/inputTypeSchemas/OrganisationMemberRoleSchema' or its corresponding type declarations.
12:20:00.510 ../../packages/trpc/server/organisation-router/find-organisation-members.types.ts(5,37): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/OrganisationGroupSchema' or its corresponding type declarations.
12:20:00.510 ../../packages/trpc/server/organisation-router/find-organisation-members.types.ts(6,42): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/OrganisationMemberSchema' or its corresponding type declarations.
12:20:00.510 ../../packages/trpc/server/organisation-router/get-organisation-member-invites.types.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberInviteStatus'.
12:20:00.510 ../../packages/trpc/server/organisation-router/get-organisation-member-invites.types.ts(4,48): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/OrganisationMemberInviteSchema' or its corresponding type declarations.
12:20:00.510 ../../packages/trpc/server/organisation-router/get-organisation-member-invites.types.ts(5,32): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/OrganisationSchema' or its corresponding type declarations.
12:20:00.510 ../../packages/trpc/server/organisation-router/get-organisation-session.ts(75,29): error TS7006: Parameter 'organisation' implicitly has an 'any' type.
12:20:00.510 ../../packages/trpc/server/organisation-router/get-organisation-session.ts(80,38): error TS7006: Parameter 'team' implicitly has an 'any' type.
12:20:00.510 ../../packages/trpc/server/organisation-router/get-organisation-session.types.ts(4,56): error TS2307: Cannot find module '@signtusk/prisma/generated/types' or its corresponding type declarations.
12:20:00.510 ../../packages/trpc/server/organisation-router/get-organisation-session.types.ts(5,32): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/SubscriptionSchema' or its corresponding type declarations.
12:20:00.510 ../../packages/trpc/server/organisation-router/get-organisation-session.types.ts(6,24): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/TeamSchema' or its corresponding type declarations.
12:20:00.510 ../../packages/trpc/server/organisation-router/get-organisation.types.ts(4,37): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/OrganisationClaimSchema' or its corresponding type declarations.
12:20:00.510 ../../packages/trpc/server/organisation-router/get-organisation.types.ts(5,46): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/OrganisationGlobalSettingsSchema' or its corresponding type declarations.
12:20:00.510 ../../packages/trpc/server/organisation-router/get-organisation.types.ts(6,38): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/OrganisationMemberSchema' or its corresponding type declarations.
12:20:00.510 ../../packages/trpc/server/organisation-router/get-organisation.types.ts(7,32): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/SubscriptionSchema' or its corresponding type declarations.
12:20:00.510 ../../packages/trpc/server/organisation-router/get-organisation.types.ts(8,24): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/TeamSchema' or its corresponding type declarations.
12:20:00.510 ../../packages/trpc/server/organisation-router/get-organisations.ts(49,31): error TS7031: Binding element 'groups' implicitly has an 'any' type.
12:20:00.510 ../../packages/trpc/server/organisation-router/get-organisations.types.ts(4,42): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/inputTypeSchemas/OrganisationMemberRoleSchema' or its corresponding type declarations.
12:20:00.510 ../../packages/trpc/server/organisation-router/update-organisation-group.ts(12,39): error TS2307: Cannot find module '@signtusk/prisma/generated/types' or its corresponding type declarations.
12:20:00.510 ../../packages/trpc/server/organisation-router/update-organisation-group.ts(81,75): error TS2345: Argument of type '{}' is not assignable to parameter of type 'string | number | symbol'.
12:20:00.510 ../../packages/trpc/server/organisation-router/update-organisation-group.ts(88,35): error TS2345: Argument of type '{}' is not assignable to parameter of type 'IterableContainer'.
12:20:00.510 ../../packages/trpc/server/organisation-router/update-organisation-group.ts(91,8): error TS7006: Parameter 'member' implicitly has an 'any' type.
12:20:00.510 ../../packages/trpc/server/organisation-router/update-organisation-group.ts(91,44): error TS2345: Argument of type 'any' is not assignable to parameter of type 'never'.
12:20:00.510 ../../packages/trpc/server/organisation-router/update-organisation-group.ts(97,12): error TS7006: Parameter 'member' implicitly has an 'any' type.
12:20:00.510 ../../packages/trpc/server/organisation-router/update-organisation-group.ts(101,38): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.510 ../../packages/trpc/server/organisation-router/update-organisation-group.ts(117,62): error TS7006: Parameter 'm' implicitly has an 'any' type.
12:20:00.510 ../../packages/trpc/server/organisation-router/update-organisation-group.types.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberRole'.
12:20:00.510 ../../packages/trpc/server/organisation-router/update-organisation-members.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationGroupType'.
12:20:00.510 ../../packages/trpc/server/organisation-router/update-organisation-members.ts(69,52): error TS7006: Parameter 'member' implicitly has an 'any' type.
12:20:00.510 ../../packages/trpc/server/organisation-router/update-organisation-members.ts(72,8): error TS7006: Parameter 'member' implicitly has an 'any' type.
12:20:00.510 ../../packages/trpc/server/organisation-router/update-organisation-members.ts(84,10): error TS7031: Binding element 'group' implicitly has an 'any' type.
12:20:00.510 ../../packages/trpc/server/organisation-router/update-organisation-members.ts(95,68): error TS7006: Parameter 'member' implicitly has an 'any' type.
12:20:00.510 ../../packages/trpc/server/organisation-router/update-organisation-members.ts(111,7): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string | number | symbol'.
12:20:00.510 ../../packages/trpc/server/organisation-router/update-organisation-members.ts(121,8): error TS7006: Parameter 'group' implicitly has an 'any' type.
12:20:00.510 ../../packages/trpc/server/organisation-router/update-organisation-members.ts(125,8): error TS7006: Parameter 'group' implicitly has an 'any' type.
12:20:00.510 ../../packages/trpc/server/organisation-router/update-organisation-members.ts(145,38): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.510 ../../packages/trpc/server/organisation-router/update-organisation-members.types.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberRole'.
12:20:00.511 ../../packages/trpc/server/organisation-router/update-organisation-settings.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationType'.
12:20:00.511 ../../packages/trpc/server/recipient-router/router.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.511 ../../packages/trpc/server/recipient-router/router.ts(115,22): error TS2322: Type '{ [x: string]: any; email?: unknown; name?: unknown; role?: unknown; signingOrder?: unknown; accessAuth?: unknown; actionAuth?: unknown; }' is not assignable to type '{ email: string; name: string; role: RecipientRole; signingOrder?: number | null | undefined; accessAuth?: ("ACCOUNT" | "TWO_FACTOR_AUTH")[] | undefined; actionAuth?: ("ACCOUNT" | "PASSKEY" | "TWO_FACTOR_AUTH" | "PASSWORD" | "EXPLICIT_NONE")[] | undefined; }'.
12:20:00.511 Types of property 'email' are incompatible.
12:20:00.511 Type 'unknown' is not assignable to type 'string'.
12:20:00.511 ../../packages/trpc/server/recipient-router/router.ts(154,9): error TS2322: Type '{ [x: string]: any; email?: unknown; name?: unknown; role?: unknown; signingOrder?: unknown; accessAuth?: unknown; actionAuth?: unknown; }[]' is not assignable to type '{ email: string; name: string; role: RecipientRole; signingOrder?: number | null | undefined; accessAuth?: ("ACCOUNT" | "TWO_FACTOR_AUTH")[] | undefined; actionAuth?: ("ACCOUNT" | "PASSKEY" | "TWO_FACTOR_AUTH" | "PASSWORD" | "EXPLICIT_NONE")[] | undefined; }[]'.
12:20:00.511 Type '{ [x: string]: any; email?: unknown; name?: unknown; role?: unknown; signingOrder?: unknown; accessAuth?: unknown; actionAuth?: unknown; }' is not assignable to type '{ email: string; name: string; role: RecipientRole; signingOrder?: number | null | undefined; accessAuth?: ("ACCOUNT" | "TWO_FACTOR_AUTH")[] | undefined; actionAuth?: ("ACCOUNT" | "PASSKEY" | "TWO_FACTOR_AUTH" | "PASSWORD" | "EXPLICIT_NONE")[] | undefined; }'.
12:20:00.511 Types of property 'email' are incompatible.
12:20:00.511 Type 'unknown' is not assignable to type 'string'.
12:20:00.511 ../../packages/trpc/server/recipient-router/router.ts(191,22): error TS2322: Type '{ [x: string]: any; id?: unknown; email?: unknown; name?: unknown; role?: unknown; signingOrder?: unknown; accessAuth?: unknown; actionAuth?: unknown; }' is not assignable to type '{ id: number; email?: string | undefined; name?: string | undefined; role?: any; signingOrder?: number | null | undefined; accessAuth?: ("ACCOUNT" | "TWO_FACTOR_AUTH")[] | undefined; actionAuth?: ("ACCOUNT" | ... 3 more ... | "EXPLICIT_NONE")[] | undefined; }'.
12:20:00.511 Types of property 'id' are incompatible.
12:20:00.511 Type 'unknown' is not assignable to type 'number'.
12:20:00.511 ../../packages/trpc/server/recipient-router/router.ts(230,9): error TS2322: Type '{ [x: string]: any; id?: unknown; email?: unknown; name?: unknown; role?: unknown; signingOrder?: unknown; accessAuth?: unknown; actionAuth?: unknown; }[]' is not assignable to type '{ id: number; email?: string | undefined; name?: string | undefined; role?: any; signingOrder?: number | null | undefined; accessAuth?: ("ACCOUNT" | "TWO_FACTOR_AUTH")[] | undefined; actionAuth?: ("ACCOUNT" | ... 3 more ... | "EXPLICIT_NONE")[] | undefined; }[]'.
12:20:00.511 Type '{ [x: string]: any; id?: unknown; email?: unknown; name?: unknown; role?: unknown; signingOrder?: unknown; accessAuth?: unknown; actionAuth?: unknown; }' is not assignable to type '{ id: number; email?: string | undefined; name?: string | undefined; role?: any; signingOrder?: number | null | undefined; accessAuth?: ("ACCOUNT" | "TWO_FACTOR_AUTH")[] | undefined; actionAuth?: ("ACCOUNT" | ... 3 more ... | "EXPLICIT_NONE")[] | undefined; }'.
12:20:00.511 Types of property 'id' are incompatible.
12:20:00.511 Type 'unknown' is not assignable to type 'number'.
12:20:00.511 ../../packages/trpc/server/recipient-router/router.ts(292,9): error TS2322: Type '{ id: unknown; email: unknown; name: unknown; role: unknown; signingOrder: unknown; actionAuth: unknown; }[]' is not assignable to type 'RecipientData[]'.
12:20:00.511 Type '{ id: unknown; email: unknown; name: unknown; role: unknown; signingOrder: unknown; actionAuth: unknown; }' is not assignable to type 'RecipientData'.
12:20:00.511 Types of property 'id' are incompatible.
12:20:00.511 Type 'unknown' is not assignable to type 'number | null | undefined'.
12:20:00.511 ../../packages/trpc/server/recipient-router/router.ts(370,22): error TS2322: Type '{ [x: string]: any; email?: unknown; name?: unknown; role?: unknown; signingOrder?: unknown; accessAuth?: unknown; actionAuth?: unknown; }' is not assignable to type '{ email: string; name: string; role: RecipientRole; signingOrder?: number | null | undefined; accessAuth?: ("ACCOUNT" | "TWO_FACTOR_AUTH")[] | undefined; actionAuth?: ("ACCOUNT" | "PASSKEY" | "TWO_FACTOR_AUTH" | "PASSWORD" | "EXPLICIT_NONE")[] | undefined; }'.
12:20:00.511 Types of property 'email' are incompatible.
12:20:00.511 Type 'unknown' is not assignable to type 'string'.
12:20:00.511 ../../packages/trpc/server/recipient-router/router.ts(409,9): error TS2322: Type '{ [x: string]: any; email?: unknown; name?: unknown; role?: unknown; signingOrder?: unknown; accessAuth?: unknown; actionAuth?: unknown; }[]' is not assignable to type '{ email: string; name: string; role: RecipientRole; signingOrder?: number | null | undefined; accessAuth?: ("ACCOUNT" | "TWO_FACTOR_AUTH")[] | undefined; actionAuth?: ("ACCOUNT" | "PASSKEY" | "TWO_FACTOR_AUTH" | "PASSWORD" | "EXPLICIT_NONE")[] | undefined; }[]'.
12:20:00.511 Type '{ [x: string]: any; email?: unknown; name?: unknown; role?: unknown; signingOrder?: unknown; accessAuth?: unknown; actionAuth?: unknown; }' is not assignable to type '{ email: string; name: string; role: RecipientRole; signingOrder?: number | null | undefined; accessAuth?: ("ACCOUNT" | "TWO_FACTOR_AUTH")[] | undefined; actionAuth?: ("ACCOUNT" | "PASSKEY" | "TWO_FACTOR_AUTH" | "PASSWORD" | "EXPLICIT_NONE")[] | undefined; }'.
12:20:00.511 Types of property 'email' are incompatible.
12:20:00.511 Type 'unknown' is not assignable to type 'string'.
12:20:00.511 ../../packages/trpc/server/recipient-router/router.ts(446,22): error TS2322: Type '{ [x: string]: any; id?: unknown; email?: unknown; name?: unknown; role?: unknown; signingOrder?: unknown; accessAuth?: unknown; actionAuth?: unknown; }' is not assignable to type '{ id: number; email?: string | undefined; name?: string | undefined; role?: any; signingOrder?: number | null | undefined; accessAuth?: ("ACCOUNT" | "TWO_FACTOR_AUTH")[] | undefined; actionAuth?: ("ACCOUNT" | ... 3 more ... | "EXPLICIT_NONE")[] | undefined; }'.
12:20:00.511 Types of property 'id' are incompatible.
12:20:00.511 Type 'unknown' is not assignable to type 'number'.
12:20:00.511 ../../packages/trpc/server/recipient-router/router.ts(485,9): error TS2322: Type '{ [x: string]: any; id?: unknown; email?: unknown; name?: unknown; role?: unknown; signingOrder?: unknown; accessAuth?: unknown; actionAuth?: unknown; }[]' is not assignable to type '{ id: number; email?: string | undefined; name?: string | undefined; role?: any; signingOrder?: number | null | undefined; accessAuth?: ("ACCOUNT" | "TWO_FACTOR_AUTH")[] | undefined; actionAuth?: ("ACCOUNT" | ... 3 more ... | "EXPLICIT_NONE")[] | undefined; }[]'.
12:20:00.511 Type '{ [x: string]: any; id?: unknown; email?: unknown; name?: unknown; role?: unknown; signingOrder?: unknown; accessAuth?: unknown; actionAuth?: unknown; }' is not assignable to type '{ id: number; email?: string | undefined; name?: string | undefined; role?: any; signingOrder?: number | null | undefined; accessAuth?: ("ACCOUNT" | "TWO_FACTOR_AUTH")[] | undefined; actionAuth?: ("ACCOUNT" | ... 3 more ... | "EXPLICIT_NONE")[] | undefined; }'.
12:20:00.511 Types of property 'id' are incompatible.
12:20:00.511 Type 'unknown' is not assignable to type 'number'.
12:20:00.511 ../../packages/trpc/server/recipient-router/router.ts(547,9): error TS2322: Type '{ id: unknown; email: unknown; name: unknown; role: unknown; signingOrder: unknown; actionAuth: unknown; }[]' is not assignable to type '{ id?: number | undefined; email: string; name: string; role: RecipientRole; signingOrder?: number | null | undefined; actionAuth?: ("ACCOUNT" | "PASSKEY" | "TWO_FACTOR_AUTH" | "PASSWORD" | "EXPLICIT_NONE")[] | undefined; }[]'.
12:20:00.511 Type '{ id: unknown; email: unknown; name: unknown; role: unknown; signingOrder: unknown; actionAuth: unknown; }' is not assignable to type '{ id?: number | undefined; email: string; name: string; role: RecipientRole; signingOrder?: number | null | undefined; actionAuth?: ("ACCOUNT" | "PASSKEY" | "TWO_FACTOR_AUTH" | "PASSWORD" | "EXPLICIT_NONE")[] | undefined; }'.
12:20:00.511 Types of property 'id' are incompatible.
12:20:00.511 Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.511 ../../packages/trpc/server/recipient-router/schema.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.511 ../../packages/trpc/server/team-router/create-team-groups.ts(14,8): error TS2307: Cannot find module '@signtusk/prisma/generated/types' or its corresponding type declarations.
12:20:00.511 ../../packages/trpc/server/team-router/create-team-groups.ts(70,12): error TS7031: Binding element 'id' implicitly has an 'any' type.
12:20:00.511 ../../packages/trpc/server/team-router/create-team-groups.ts(88,46): error TS7006: Parameter 'teamGroup' implicitly has an 'any' type.
12:20:00.511 ../../packages/trpc/server/team-router/create-team-groups.ts(93,63): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string | number | symbol'.
12:20:00.511 ../../packages/trpc/server/team-router/create-team-groups.types.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'TeamMemberRole'.
12:20:00.511 ../../packages/trpc/server/team-router/create-team-members.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationGroupType'.
12:20:00.512 ../../packages/trpc/server/team-router/create-team-members.ts(1,33): error TS2305: Module '"@prisma/client"' has no exported member 'TeamMemberRole'.
12:20:00.512 ../../packages/trpc/server/team-router/create-team-members.ts(34,7): error TS2322: Type '{ [x: string]: any; organisationMemberId?: unknown; teamRole?: unknown; }[]' is not assignable to type '{ organisationMemberId: string; teamRole: TeamMemberRole; }[]'.
12:20:00.512 Type '{ [x: string]: any; organisationMemberId?: unknown; teamRole?: unknown; }' is not assignable to type '{ organisationMemberId: string; teamRole: TeamMemberRole; }'.
12:20:00.512 Types of property 'organisationMemberId' are incompatible.
12:20:00.512 Type 'unknown' is not assignable to type 'string'.
12:20:00.512 ../../packages/trpc/server/team-router/create-team-members.ts(88,39): error TS7031: Binding element 'id' implicitly has an 'any' type.
12:20:00.512 ../../packages/trpc/server/team-router/create-team-members.ts(98,6): error TS7006: Parameter 'group' implicitly has an 'any' type.
12:20:00.512 ../../packages/trpc/server/team-router/create-team-members.ts(105,6): error TS7006: Parameter 'group' implicitly has an 'any' type.
12:20:00.512 ../../packages/trpc/server/team-router/create-team-members.ts(112,6): error TS7006: Parameter 'group' implicitly has an 'any' type.
12:20:00.512 ../../packages/trpc/server/team-router/create-team-members.types.ts(3,32): error TS2307: Cannot find module '@signtusk/prisma/generated/types' or its corresponding type declarations.
12:20:00.512 ../../packages/trpc/server/team-router/create-team-members.types.ts(20,22): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string'.
12:20:00.512 ../../packages/trpc/server/team-router/create-team-members.types.ts(27,20): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string'.
12:20:00.512 ../../packages/trpc/server/team-router/delete-team-group.ts(6,63): error TS2307: Cannot find module '@signtusk/prisma/generated/types' or its corresponding type declarations.
12:20:00.512 ../../packages/trpc/server/team-router/delete-team-member.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationGroupType'.
12:20:00.512 ../../packages/trpc/server/team-router/delete-team.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'TeamMemberRole'.
12:20:00.512 ../../packages/trpc/server/team-router/find-team-groups.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationGroupType'.
12:20:00.512 ../../packages/trpc/server/team-router/find-team-groups.ts(1,38): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberRole'.
12:20:00.512 ../../packages/trpc/server/team-router/find-team-groups.ts(63,29): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'TeamGroupWhereInput'.
12:20:00.512 ../../packages/trpc/server/team-router/find-team-groups.ts(77,24): error TS2339: Property 'QueryMode' does not exist on type 'typeof Prisma'.
12:20:00.512 ../../packages/trpc/server/team-router/find-team-groups.ts(128,32): error TS7006: Parameter 'group' implicitly has an 'any' type.
12:20:00.512 ../../packages/trpc/server/team-router/find-team-groups.ts(135,70): error TS7031: Binding element 'organisationMember' implicitly has an 'any' type.
12:20:00.512 ../../packages/trpc/server/team-router/find-team-groups.types.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationGroupType'.
12:20:00.512 ../../packages/trpc/server/team-router/find-team-groups.types.ts(1,33): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationMemberRole'.
12:20:00.512 ../../packages/trpc/server/team-router/find-team-groups.types.ts(5,33): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/TeamGroupSchema' or its corresponding type declarations.
12:20:00.512 ../../packages/trpc/server/team-router/find-team-members.types.ts(4,56): error TS2307: Cannot find module '@signtusk/prisma/generated/types' or its corresponding type declarations.
12:20:00.512 ../../packages/trpc/server/team-router/find-team-members.types.ts(5,38): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/OrganisationMemberSchema' or its corresponding type declarations.
12:20:00.512 ../../packages/trpc/server/team-router/find-teams.types.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'TeamMemberRole'.
12:20:00.512 ../../packages/trpc/server/team-router/find-teams.types.ts(5,24): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/TeamSchema' or its corresponding type declarations.
12:20:00.512 ../../packages/trpc/server/team-router/get-team-members.types.ts(3,56): error TS2307: Cannot find module '@signtusk/prisma/generated/types' or its corresponding type declarations.
12:20:00.512 ../../packages/trpc/server/team-router/get-team-members.types.ts(4,38): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/OrganisationMemberSchema' or its corresponding type declarations.
12:20:00.512 ../../packages/trpc/server/team-router/get-team.types.ts(3,32): error TS2307: Cannot find module '@signtusk/prisma/generated/types' or its corresponding type declarations.
12:20:00.512 ../../packages/trpc/server/team-router/get-team.types.ts(4,46): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/OrganisationGlobalSettingsSchema' or its corresponding type declarations.
12:20:00.512 ../../packages/trpc/server/team-router/get-team.types.ts(5,38): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/TeamGlobalSettingsSchema' or its corresponding type declarations.
12:20:00.512 ../../packages/trpc/server/team-router/get-team.types.ts(6,24): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/TeamSchema' or its corresponding type declarations.
12:20:00.512 ../../packages/trpc/server/team-router/schema.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'TeamMemberRole'.
12:20:00.512 ../../packages/trpc/server/team-router/update-team-group.ts(6,39): error TS2307: Cannot find module '@signtusk/prisma/generated/types' or its corresponding type declarations.
12:20:00.512 ../../packages/trpc/server/team-router/update-team-group.ts(71,61): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string | number | symbol'.
12:20:00.512 ../../packages/trpc/server/team-router/update-team-group.types.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'TeamMemberRole'.
12:20:00.512 ../../packages/trpc/server/team-router/update-team-member.ts(9,55): error TS2307: Cannot find module '@signtusk/prisma/generated/types' or its corresponding type declarations.
12:20:00.512 ../../packages/trpc/server/team-router/update-team-member.ts(78,8): error TS7006: Parameter 'group' implicitly has an 'any' type.
12:20:00.512 ../../packages/trpc/server/team-router/update-team-member.ts(82,12): error TS7006: Parameter 'member' implicitly has an 'any' type.
12:20:00.512 ../../packages/trpc/server/team-router/update-team-member.ts(87,8): error TS7006: Parameter 'group' implicitly has an 'any' type.
12:20:00.512 ../../packages/trpc/server/team-router/update-team-member.ts(94,8): error TS7006: Parameter 'group' implicitly has an 'any' type.
12:20:00.512 ../../packages/trpc/server/team-router/update-team-member.ts(101,8): error TS7006: Parameter 'group' implicitly has an 'any' type.
12:20:00.512 ../../packages/trpc/server/team-router/update-team-member.ts(143,61): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string | number | symbol'.
12:20:00.512 ../../packages/trpc/server/team-router/update-team-member.ts(150,38): error TS7006: Parameter 'tx' implicitly has an 'any' type.
12:20:00.512 ../../packages/trpc/server/team-router/update-team-member.ts(170,14): error TS2349: This expression is not callable.
12:20:00.512 Type 'NonExhaustiveError<unknown>' has no call signatures.
12:20:00.512 ../../packages/trpc/server/team-router/update-team-member.types.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'TeamMemberRole'.
12:20:00.512 ../../packages/trpc/server/team-router/update-team-settings.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'OrganisationType'.
12:20:00.513 ../../packages/trpc/server/team-router/update-team-settings.ts(165,55): error TS2339: Property 'DbNull' does not exist on type 'typeof Prisma'.
12:20:00.513 ../../packages/trpc/server/template-router/router.ts(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'Envelope'.
12:20:00.513 ../../packages/trpc/server/template-router/router.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentDataType'.
12:20:00.513 ../../packages/trpc/server/template-router/router.ts(2,28): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.513 ../../packages/trpc/server/template-router/router.ts(83,42): error TS2345: Argument of type '{ query?: unknown; page?: unknown; perPage?: unknown; type?: unknown; folderId?: unknown; userId: any; teamId: any; }' is not assignable to parameter of type 'FindTemplatesOptions'.
12:20:00.513 Types of property 'page' are incompatible.
12:20:00.513 Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.513 ../../packages/trpc/server/template-router/router.ts(92,32): error TS7006: Parameter 'envelope' implicitly has an 'any' type.
12:20:00.513 ../../packages/trpc/server/template-router/router.ts(112,42): error TS7006: Parameter 'field' implicitly has an 'any' type.
12:20:00.513 ../../packages/trpc/server/template-router/router.ts(113,50): error TS7006: Parameter 'recipient' implicitly has an 'any' type.
12:20:00.513 ../../packages/trpc/server/template-router/router.ts(208,11): error TS2322: Type 'unknown' is not assignable to type 'string'.
12:20:00.513 ../../packages/trpc/server/template-router/router.ts(214,11): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.513 ../../packages/trpc/server/template-router/router.ts(215,11): error TS2322: Type '{} | undefined' is not assignable to type 'string | undefined'.
12:20:00.513 Type '{}' is not assignable to type 'string'.
12:20:00.513 ../../packages/trpc/server/template-router/router.ts(217,11): error TS2322: Type 'unknown' is not assignable to type '("ACCOUNT" | "TWO_FACTOR_AUTH")[] | undefined'.
12:20:00.513 ../../packages/trpc/server/template-router/router.ts(218,11): error TS2322: Type 'unknown' is not assignable to type '("ACCOUNT" | "PASSKEY" | "TWO_FACTOR_AUTH" | "PASSWORD")[] | undefined'.
12:20:00.513 ../../packages/trpc/server/template-router/router.ts(220,11): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.513 ../../packages/trpc/server/template-router/router.ts(221,11): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.513 ../../packages/trpc/server/template-router/router.ts(223,9): error TS2322: Type 'unknown' is not assignable to type 'Partial<Omit<DocumentMeta, "id">> | undefined'.
12:20:00.513 ../../packages/trpc/server/template-router/router.ts(224,9): error TS2322: Type 'unknown' is not assignable to type '{ label: string; data: string; type?: "link" | undefined; }[] | undefined'.
12:20:00.513 ../../packages/trpc/server/template-router/router.ts(270,24): error TS18046: 'title' is of type 'unknown'.
12:20:00.513 ../../packages/trpc/server/template-router/router.ts(272,52): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string'.
12:20:00.513 ../../packages/trpc/server/template-router/router.ts(285,11): error TS2322: Type 'unknown' is not assignable to type 'string'.
12:20:00.513 ../../packages/trpc/server/template-router/router.ts(291,11): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.513 ../../packages/trpc/server/template-router/router.ts(292,11): error TS2322: Type '{} | undefined' is not assignable to type 'string | undefined'.
12:20:00.513 Type '{}' is not assignable to type 'string'.
12:20:00.513 ../../packages/trpc/server/template-router/router.ts(294,11): error TS2322: Type 'unknown' is not assignable to type '("ACCOUNT" | "TWO_FACTOR_AUTH")[] | undefined'.
12:20:00.513 ../../packages/trpc/server/template-router/router.ts(295,11): error TS2322: Type 'unknown' is not assignable to type '("ACCOUNT" | "PASSKEY" | "TWO_FACTOR_AUTH" | "PASSWORD")[] | undefined'.
12:20:00.513 ../../packages/trpc/server/template-router/router.ts(297,11): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.513 ../../packages/trpc/server/template-router/router.ts(298,11): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.513 ../../packages/trpc/server/template-router/router.ts(300,9): error TS2322: Type 'unknown' is not assignable to type 'Partial<Omit<DocumentMeta, "id">> | undefined'.
12:20:00.513 ../../packages/trpc/server/template-router/router.ts(301,9): error TS2322: Type 'unknown' is not assignable to type '{ label: string; data: string; type?: "link" | undefined; }[] | undefined'.
12:20:00.513 ../../packages/trpc/server/template-router/router.ts(354,9): error TS2322: Type '{ templateType: unknown; title?: unknown; externalId?: unknown; visibility?: unknown; globalAccessAuth?: unknown; globalActionAuth?: unknown; publicTitle?: unknown; publicDescription?: unknown; type?: unknown; useLegacyFieldInsertion?: unknown; folderId?: unknown; }' is not assignable to type '{ title?: string | undefined; folderId?: string | null | undefined; externalId?: string | null | undefined; visibility?: any; globalAccessAuth?: ("ACCOUNT" | "TWO_FACTOR_AUTH")[] | undefined; ... 4 more ...; useLegacyFieldInsertion?: boolean | undefined; }'.
12:20:00.513 Types of property 'title' are incompatible.
12:20:00.513 Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.513 ../../packages/trpc/server/template-router/router.ts(502,9): error TS2322: Type '{ [x: string]: any; title?: unknown; subject?: unknown; message?: unknown; timezone?: unknown; dateFormat?: unknown; redirectUrl?: unknown; distributionMethod?: unknown; emailSettings?: unknown; language?: unknown; typedSignatureEnabled?: unknown; uploadSignatureEnabled?: unknown; drawSignatureEnabled?: unknown; all...' is not assignable to type '{ title?: string | undefined; subject?: string | undefined; message?: string | undefined; timezone?: string | undefined; password?: string | undefined; dateFormat?: string | undefined; ... 8 more ...; drawSignatureEnabled?: boolean | undefined; } | undefined'.
12:20:00.513 Type '{ [x: string]: any; title?: unknown; subject?: unknown; message?: unknown; timezone?: unknown; dateFormat?: unknown; redirectUrl?: unknown; distributionMethod?: unknown; emailSettings?: unknown; language?: unknown; typedSignatureEnabled?: unknown; uploadSignatureEnabled?: unknown; drawSignatureEnabled?: unknown; all...' is not assignable to type '{ title?: string | undefined; subject?: string | undefined; message?: string | undefined; timezone?: string | undefined; password?: string | undefined; dateFormat?: string | undefined; ... 8 more ...; drawSignatureEnabled?: boolean | undefined; }'.
12:20:00.513 Types of property 'title' are incompatible.
12:20:00.513 Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.513 ../../packages/trpc/server/template-router/schema.ts(2,9): error TS2339: Property 'DocumentSigningOrder' does not exist on type 'typeof import("/vercel/path0/node_modules/@prisma/client/default")'.
12:20:00.513 ../../packages/trpc/server/template-router/schema.ts(2,31): error TS2339: Property 'DocumentVisibility' does not exist on type 'typeof import("/vercel/path0/node_modules/@prisma/client/default")'.
12:20:00.513 ../../packages/trpc/server/template-router/schema.ts(2,51): error TS2339: Property 'TemplateType' does not exist on type 'typeof import("/vercel/path0/node_modules/@prisma/client/default")'.
12:20:00.513 ../../packages/trpc/server/trpc.ts(137,13): error TS18047: 'ctx.user' is possibly 'null'.
12:20:00.513 ../../packages/trpc/server/trpc.ts(151,15): error TS18047: 'ctx.user' is possibly 'null'.
12:20:00.513 ../../packages/trpc/server/trpc.ts(152,17): error TS18047: 'ctx.user' is possibly 'null'.
12:20:00.513 ../../packages/trpc/server/trpc.ts(153,18): error TS18047: 'ctx.user' is possibly 'null'.
12:20:00.513 ../../packages/trpc/server/webhook-router/find-webhook-calls.ts(1,18): error TS2305: Module '"@prisma/client"' has no exported member 'WebhookCallStatus'.
12:20:00.513 ../../packages/trpc/server/webhook-router/find-webhook-calls.ts(1,37): error TS2305: Module '"@prisma/client"' has no exported member 'WebhookTriggerEvents'.
12:20:00.514 ../../packages/trpc/server/webhook-router/find-webhook-calls.ts(28,7): error TS2322: Type 'unknown' is not assignable to type 'string'.
12:20:00.514 ../../packages/trpc/server/webhook-router/find-webhook-calls.ts(29,7): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.514 ../../packages/trpc/server/webhook-router/find-webhook-calls.ts(30,7): error TS2322: Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.514 ../../packages/trpc/server/webhook-router/find-webhook-calls.ts(32,7): error TS2322: Type 'unknown' is not assignable to type 'string | undefined'.
12:20:00.514 ../../packages/trpc/server/webhook-router/find-webhook-calls.ts(33,7): error TS2322: Type 'unknown' is not assignable to type 'WebhookTriggerEvents[] | undefined'.
12:20:00.514 ../../packages/trpc/server/webhook-router/find-webhook-calls.ts(73,29): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'WebhookCallWhereInput'.
12:20:00.514 ../../packages/trpc/server/webhook-router/find-webhook-calls.types.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'WebhookCallStatus'.
12:20:00.514 ../../packages/trpc/server/webhook-router/find-webhook-calls.types.ts(1,29): error TS2305: Module '"@prisma/client"' has no exported member 'WebhookTriggerEvents'.
12:20:00.514 ../../packages/trpc/server/webhook-router/find-webhook-calls.types.ts(5,31): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/WebhookCallSchema' or its corresponding type declarations.
12:20:00.514 ../../packages/trpc/server/webhook-router/resend-webhook-call.ts(1,18): error TS2305: Module '"@prisma/client"' has no exported member 'WebhookCallStatus'.
12:20:00.525 ../../packages/trpc/server/webhook-router/resend-webhook-call.ts(1,37): error TS2305: Module '"@prisma/client"' has no exported member 'WebhookTriggerEvents'.
12:20:00.525 ../../packages/trpc/server/webhook-router/resend-webhook-call.ts(61,30): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'InputJsonValue'.
12:20:00.525 ../../packages/trpc/server/webhook-router/resend-webhook-call.ts(61,54): error TS2694: Namespace '"/vercel/path0/node_modules/.prisma/client/default".Prisma' has no exported member 'JsonNullValueInput'.
12:20:00.525 ../../packages/trpc/server/webhook-router/resend-webhook-call.ts(61,82): error TS2339: Property 'JsonNull' does not exist on type 'typeof Prisma'.
12:20:00.525 ../../packages/trpc/server/webhook-router/resend-webhook-call.types.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'WebhookCallStatus'.
12:20:00.525 ../../packages/trpc/server/webhook-router/resend-webhook-call.types.ts(1,29): error TS2305: Module '"@prisma/client"' has no exported member 'WebhookTriggerEvents'.
12:20:00.525 ../../packages/trpc/server/webhook-router/resend-webhook-call.types.ts(4,31): error TS2307: Cannot find module '@signtusk/prisma/generated/zod/modelSchema/WebhookCallSchema' or its corresponding type declarations.
12:20:00.526 ../../packages/trpc/server/webhook-router/router.ts(118,9): error TS2322: Type 'unknown' is not assignable to type 'string'.
12:20:00.526 ../../packages/trpc/server/webhook-router/schema.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'WebhookTriggerEvents'.
12:20:00.526 ../../packages/ui/components/document/document-read-only-fields.tsx(5,15): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentMeta'.
12:20:00.526 ../../packages/ui/components/document/document-read-only-fields.tsx(5,29): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.526 ../../packages/ui/components/document/document-read-only-fields.tsx(5,36): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.526 ../../packages/ui/components/document/document-read-only-fields.tsx(6,10): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.526 ../../packages/ui/components/document/document-visibility-select.tsx(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'TeamMemberRole'.
12:20:00.526 ../../packages/ui/components/document/envelope-recipient-field-tooltip.tsx(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.526 ../../packages/ui/components/document/envelope-recipient-field-tooltip.tsx(5,15): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.526 ../../packages/ui/components/document/envelope-recipient-field-tooltip.tsx(5,22): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.526 ../../packages/ui/components/field/envelope-field-tooltip.tsx(3,15): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.526 ../../packages/ui/components/field/field-tooltip.tsx(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.526 ../../packages/ui/components/field/field-tooltip.tsx(5,30): error TS7016: Could not find a declaration file for module 'react-dom'. '/vercel/path0/node_modules/react-dom/index.js' implicitly has an 'any' type.
12:20:00.526 Try `npm i --save-dev @types/react-dom` if it exists or add a new declaration (.d.ts) file containing `declare module 'react-dom';`
12:20:00.526 ../../packages/ui/components/field/field.tsx(3,15): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.526 ../../packages/ui/components/field/field.tsx(3,22): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.526 ../../packages/ui/components/field/field.tsx(4,30): error TS7016: Could not find a declaration file for module 'react-dom'. '/vercel/path0/node_modules/react-dom/index.js' implicitly has an 'any' type.
12:20:00.526 Try `npm i --save-dev @types/react-dom` if it exists or add a new declaration (.d.ts) file containing `declare module 'react-dom';`
12:20:00.526 ../../packages/ui/components/recipient/recipient-role-select.tsx(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.526 ../../packages/ui/components/signing-card.tsx(3,15): error TS2305: Module '"@prisma/client"' has no exported member 'Signature'.
12:20:00.526 ../../packages/ui/components/signing-card.tsx(177,9): error TS2322: Type 'unknown' is not assignable to type 'ReactNode'.
12:20:00.526 ../../packages/ui/components/signing-card.tsx(185,19): error TS2353: Object literal may only specify known properties, and 'typedSignature' does not exist in type 'Matcher<undefined, unknown, any, any, unknown>'.
12:20:00.526 ../../packages/ui/components/signing-card.tsx(189,51): error TS18048: 'signature' is possibly 'undefined'.
12:20:00.526 ../../packages/ui/components/signing-card.tsx(194,16): error TS18048: 'signature' is possibly 'undefined'.
12:20:00.526 ../../packages/ui/primitives/document-flow/add-fields.tsx(7,15): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.526 ../../packages/ui/primitives/document-flow/add-fields.tsx(7,22): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.526 ../../packages/ui/primitives/document-flow/add-fields.tsx(8,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.526 ../../packages/ui/primitives/document-flow/add-fields.tsx(8,29): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.526 ../../packages/ui/primitives/document-flow/add-fields.tsx(8,44): error TS2305: Module '"@prisma/client"' has no exported member 'SendStatus'.
12:20:00.526 ../../packages/ui/primitives/document-flow/add-fields.tsx(192,44): error TS2638: Type '{}' may represent a primitive value, which is not permitted as the right operand of the 'in' operator.
12:20:00.526 ../../packages/ui/primitives/document-flow/add-fields.tsx(193,42): error TS2339: Property 'length' does not exist on type '{}'.
12:20:00.526 ../../packages/ui/primitives/document-flow/add-fields.tsx(227,41): error TS2638: Type '{}' may represent a primitive value, which is not permitted as the right operand of the 'in' operator.
12:20:00.526 ../../packages/ui/primitives/document-flow/add-fields.tsx(227,86): error TS2339: Property 'length' does not exist on type '{}'.
12:20:00.526 ../../packages/ui/primitives/document-flow/add-fields.tsx(240,29): error TS2339: Property 'Decimal' does not exist on type 'typeof Prisma'.
12:20:00.526 ../../packages/ui/primitives/document-flow/add-fields.tsx(241,29): error TS2339: Property 'Decimal' does not exist on type 'typeof Prisma'.
12:20:00.526 ../../packages/ui/primitives/document-flow/add-fields.tsx(242,25): error TS2339: Property 'Decimal' does not exist on type 'typeof Prisma'.
12:20:00.526 ../../packages/ui/primitives/document-flow/add-fields.tsx(243,26): error TS2339: Property 'Decimal' does not exist on type 'typeof Prisma'.
12:20:00.526 ../../packages/ui/primitives/document-flow/add-fields.tsx(423,20): error TS18046: 'lastActiveField.pageX' is of type 'unknown'.
12:20:00.526 ../../packages/ui/primitives/document-flow/add-fields.tsx(424,20): error TS18046: 'lastActiveField.pageY' is of type 'unknown'.
12:20:00.526 ../../packages/ui/primitives/document-flow/add-fields.tsx(481,18): error TS18046: 'copiedField.pageX' is of type 'unknown'.
12:20:00.526 ../../packages/ui/primitives/document-flow/add-fields.tsx(482,18): error TS18046: 'copiedField.pageY' is of type 'unknown'.
12:20:00.526 ../../packages/ui/primitives/document-flow/add-fields.tsx(605,11): error TS2322: Type 'FieldArrayWithId<{ fields: { [x: string]: any; formId?: unknown; nativeId?: unknown; type?: unknown; signerEmail?: unknown; recipientId?: unknown; pageNumber?: unknown; pageX?: unknown; pageY?: unknown; pageWidth?: unknown; pageHeight?: unknown; fieldMeta?: unknown; }[]; }, "fields", "id">[]' is not assignable to type 'FieldFormType[]'.
12:20:00.526 Type 'FieldArrayWithId<{ fields: { [x: string]: any; formId?: unknown; nativeId?: unknown; type?: unknown; signerEmail?: unknown; recipientId?: unknown; pageNumber?: unknown; pageX?: unknown; pageY?: unknown; pageWidth?: unknown; pageHeight?: unknown; fieldMeta?: unknown; }[]; }, "fields", "id">' is not assignable to type 'FieldFormType'.
12:20:00.526 Types of property 'nativeId' are incompatible.
12:20:00.526 Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.526 ../../packages/ui/primitives/document-flow/add-fields.tsx(693,41): error TS2345: Argument of type 'FieldArrayWithId<{ fields: { [x: string]: any; formId?: unknown; nativeId?: unknown; type?: unknown; signerEmail?: unknown; recipientId?: unknown; pageNumber?: unknown; pageX?: unknown; pageY?: unknown; pageWidth?: unknown; pageHeight?: unknown; fieldMeta?: unknown; }[]; }, "fields", "id">' is not assignable to parameter of type 'SetStateAction<FieldFormType | undefined>'.
12:20:00.526 ../../packages/ui/primitives/document-flow/add-fields.tsx(698,63): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'SetStateAction<string | null>'.
12:20:00.526 ../../packages/ui/primitives/document-flow/add-fields.tsx(1024,23): error TS2322: Type '{}' is not assignable to type 'Key | null | undefined'.
12:20:00.526 ../../packages/ui/primitives/document-flow/add-fields.types.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.526 ../../packages/ui/primitives/document-flow/add-settings.tsx(6,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.526 ../../packages/ui/primitives/document-flow/add-settings.tsx(7,3): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentVisibility'.
12:20:00.526 ../../packages/ui/primitives/document-flow/add-settings.tsx(8,8): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.526 ../../packages/ui/primitives/document-flow/add-settings.tsx(9,8): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.527 ../../packages/ui/primitives/document-flow/add-settings.tsx(10,3): error TS2305: Module '"@prisma/client"' has no exported member 'SendStatus'.
12:20:00.532 ../../packages/ui/primitives/document-flow/add-settings.tsx(11,3): error TS2305: Module '"@prisma/client"' has no exported member 'TeamMemberRole'.
12:20:00.532 ../../packages/ui/primitives/document-flow/add-settings.tsx(115,77): error TS2339: Property 'timezone' does not exist on type '{}'.
12:20:00.532 ../../packages/ui/primitives/document-flow/add-settings.tsx(118,81): error TS2339: Property 'dateFormat' does not exist on type '{}'.
12:20:00.532 ../../packages/ui/primitives/document-flow/add-settings.tsx(120,45): error TS2339: Property 'redirectUrl' does not exist on type '{}'.
12:20:00.532 ../../packages/ui/primitives/document-flow/add-settings.tsx(121,42): error TS2339: Property 'language' does not exist on type '{}'.
12:20:00.532 ../../packages/ui/primitives/document-flow/add-settings.tsx(122,54): error TS2345: Argument of type 'unknown' is not assignable to parameter of type '{ typedSignatureEnabled: boolean | null; drawSignatureEnabled: boolean | null; uploadSignatureEnabled: boolean | null; } | null | undefined'.
12:20:00.532 ../../packages/ui/primitives/document-flow/add-settings.tsx(153,43): error TS2339: Property 'timezone' does not exist on type 'boolean'.
12:20:00.532 ../../packages/ui/primitives/document-flow/add-settings.tsx(155,31): error TS2339: Property 'timezone' does not exist on type '{}'.
12:20:00.532 ../../packages/ui/primitives/document-flow/add-settings.tsx(163,40): error TS2339: Property 'timezone' does not exist on type 'boolean'.
12:20:00.532 ../../packages/ui/primitives/document-flow/add-settings.tsx(164,28): error TS2339: Property 'timezone' does not exist on type '{}'.
12:20:00.532 ../../packages/ui/primitives/document-flow/add-settings.types.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentVisibility'.
12:20:00.532 ../../packages/ui/primitives/document-flow/add-signers.tsx(9,15): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.532 ../../packages/ui/primitives/document-flow/add-signers.tsx(9,22): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.532 ../../packages/ui/primitives/document-flow/add-signers.tsx(10,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSigningOrder'.
12:20:00.532 ../../packages/ui/primitives/document-flow/add-signers.tsx(10,32): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.532 ../../packages/ui/primitives/document-flow/add-signers.tsx(10,47): error TS2305: Module '"@prisma/client"' has no exported member 'SendStatus'.
12:20:00.532 ../../packages/ui/primitives/document-flow/add-signers.tsx(156,14): error TS7006: Parameter 'signer' implicitly has an 'any' type.
12:20:00.532 ../../packages/ui/primitives/document-flow/add-signers.tsx(175,33): error TS7006: Parameter 'signer' implicitly has an 'any' type.
12:20:00.532 ../../packages/ui/primitives/document-flow/add-signers.tsx(180,14): error TS7006: Parameter 'a' implicitly has an 'any' type.
12:20:00.532 ../../packages/ui/primitives/document-flow/add-signers.tsx(180,17): error TS7006: Parameter 'b' implicitly has an 'any' type.
12:20:00.532 ../../packages/ui/primitives/document-flow/add-signers.tsx(181,13): error TS7006: Parameter 'signer' implicitly has an 'any' type.
12:20:00.532 ../../packages/ui/primitives/document-flow/add-signers.tsx(181,21): error TS7006: Parameter 'index' implicitly has an 'any' type.
12:20:00.532 ../../packages/ui/primitives/document-flow/add-signers.tsx(196,45): error TS7006: Parameter 'signer' implicitly has an 'any' type.
12:20:00.532 ../../packages/ui/primitives/document-flow/add-signers.tsx(220,52): error TS7006: Parameter 'signer' implicitly has an 'any' type.
12:20:00.532 ../../packages/ui/primitives/document-flow/add-signers.tsx(255,54): error TS7006: Parameter 'signer' implicitly has an 'any' type.
12:20:00.532 ../../packages/ui/primitives/document-flow/add-signers.tsx(257,6): error TS7006: Parameter 'signer' implicitly has an 'any' type.
12:20:00.532 ../../packages/ui/primitives/document-flow/add-signers.tsx(302,65): error TS7006: Parameter 's' implicitly has an 'any' type.
12:20:00.532 ../../packages/ui/primitives/document-flow/add-signers.tsx(306,64): error TS7006: Parameter 's' implicitly has an 'any' type.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-signers.tsx(372,68): error TS2571: Object is of type 'unknown'.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-signers.tsx(379,9): error TS2698: Spread types may only be created from object types.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-signers.tsx(380,47): error TS18046: 'signer' is of type 'unknown'.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-signers.tsx(380,66): error TS18046: 'signer' is of type 'unknown'.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-signers.tsx(424,50): error TS7006: Parameter 'signer' implicitly has an 'any' type.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-signers.tsx(424,58): error TS7006: Parameter 'idx' implicitly has an 'any' type.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-signers.tsx(463,55): error TS7006: Parameter '*' implicitly has an 'any' type.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-signers.tsx(463,58): error TS7006: Parameter 'idx' implicitly has an 'any' type.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-signers.tsx(467,52): error TS7006: Parameter 's' implicitly has an 'any' type.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-signers.tsx(467,55): error TS7006: Parameter 'idx' implicitly has an 'any' type.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-signers.tsx(493,48): error TS7006: Parameter 'signer' implicitly has an 'any' type.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-signers.tsx(691,45): error TS7053: Element implicitly has an 'any' type because expression of type 'number' can't be used to index type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.533 No index signature with a parameter of type 'number' was found on type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-signers.tsx(692,46): error TS7053: Element implicitly has an 'any' type because expression of type 'number' can't be used to index type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.533 No index signature with a parameter of type 'number' was found on type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-signers.tsx(737,41): error TS7053: Element implicitly has an 'any' type because expression of type 'number' can't be used to index type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.533 No index signature with a parameter of type 'number' was found on type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-signers.tsx(738,42): error TS7053: Element implicitly has an 'any' type because expression of type 'number' can't be used to index type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.533 No index signature with a parameter of type 'number' was found on type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-signers.tsx(786,41): error TS7053: Element implicitly has an 'any' type because expression of type 'number' can't be used to index type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.533 No index signature with a parameter of type 'number' was found on type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-signers.tsx(787,42): error TS7053: Element implicitly has an 'any' type because expression of type 'number' can't be used to index type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.533 No index signature with a parameter of type 'number' was found on type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-signers.tsx(836,45): error TS7053: Element implicitly has an 'any' type because expression of type 'number' can't be used to index type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.533 No index signature with a parameter of type 'number' was found on type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-signers.tsx(837,46): error TS7053: Element implicitly has an 'any' type because expression of type 'number' can't be used to index type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.533 No index signature with a parameter of type 'number' was found on type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-signers.tsx(867,43): error TS7053: Element implicitly has an 'any' type because expression of type 'number' can't be used to index type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.533 No index signature with a parameter of type 'number' was found on type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-signers.tsx(868,44): error TS7053: Element implicitly has an 'any' type because expression of type 'number' can't be used to index type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.533 No index signature with a parameter of type 'number' was found on type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-signers.tsx(898,47): error TS7053: Element implicitly has an 'any' type because expression of type 'number' can't be used to index type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.533 No index signature with a parameter of type 'number' was found on type 'Merge<FieldError, FieldErrorsImpl<{}>>'.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-signers.types.ts(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSigningOrder'.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-signers.types.ts(2,32): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-subject.tsx(7,15): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-subject.tsx(7,22): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-subject.tsx(8,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentDistributionMethod'.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-subject.tsx(8,38): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentStatus'.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-subject.tsx(8,54): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-subject.tsx(86,41): error TS2339: Property 'emailId' does not exist on type '{}'.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-subject.tsx(87,46): error TS2339: Property 'emailReplyTo' does not exist on type '{}'.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-subject.tsx(89,41): error TS2339: Property 'subject' does not exist on type '{}'.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-subject.tsx(90,41): error TS2339: Property 'message' does not exist on type '{}'.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-subject.tsx(92,34): error TS2339: Property 'distributionMethod' does not exist on type '{}'.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-subject.tsx(93,83): error TS2339: Property 'emailSettings' does not exist on type '{}'.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-subject.tsx(237,43): error TS2339: Property 'map' does not exist on type '{}'.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-subject.tsx(237,48): error TS7006: Parameter 'email' implicitly has an 'any' type.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-subject.tsx(439,56): error TS2538: Type 'unknown' cannot be used as an index type.
12:20:00.533 ../../packages/ui/primitives/document-flow/add-subject.types.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentDistributionMethod'.
12:20:00.533 ../../packages/ui/primitives/document-flow/field-content.tsx(3,15): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentMeta'.
12:20:00.533 ../../packages/ui/primitives/document-flow/field-content.tsx(3,29): error TS2305: Module '"@prisma/client"' has no exported member 'Signature'.
12:20:00.533 ../../packages/ui/primitives/document-flow/field-content.tsx(4,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.534 ../../packages/ui/primitives/document-flow/field-item-advanced-settings.tsx(6,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.534 ../../packages/ui/primitives/document-flow/field-item.tsx(5,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.534 ../../packages/ui/primitives/document-flow/field-item.tsx(7,30): error TS7016: Could not find a declaration file for module 'react-dom'. '/vercel/path0/node*modules/react-dom/index.js' implicitly has an 'any' type.
12:20:00.534 Try `npm i --save-dev @types/react-dom` if it exists or add a new declaration (.d.ts) file containing `declare module 'react-dom';`
12:20:00.534 ../../packages/ui/primitives/document-flow/field-item.tsx(105,14): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string'.
12:20:00.534 ../../packages/ui/primitives/document-flow/field-item.tsx(122,20): error TS18046: 'field.pageX' is of type 'unknown'.
12:20:00.534 ../../packages/ui/primitives/document-flow/field-item.tsx(123,20): error TS18046: 'field.pageY' is of type 'unknown'.
12:20:00.534 ../../packages/ui/primitives/document-flow/field-item.tsx(125,25): error TS18046: 'field.pageHeight' is of type 'unknown'.
12:20:00.534 ../../packages/ui/primitives/document-flow/field-item.tsx(126,24): error TS18046: 'field.pageWidth' is of type 'unknown'.
12:20:00.534 ../../packages/ui/primitives/document-flow/field-item.tsx(192,42): error TS2345: Argument of type 'unknown' is not assignable to parameter of type '{ type: "initials"; label?: string | undefined; placeholder?: string | undefined; required?: boolean | undefined; readOnly?: boolean | undefined; fontSize?: number | undefined; textAlign?: "left" | ... 2 more ... | undefined; } | ... 9 more ... | undefined'.
12:20:00.534 ../../packages/ui/primitives/document-flow/field-item.tsx(197,39): error TS2345: Argument of type 'unknown' is not assignable to parameter of type '{ type: "initials"; label?: string | undefined; placeholder?: string | undefined; required?: boolean | undefined; readOnly?: boolean | undefined; fontSize?: number | undefined; textAlign?: "left" | ... 2 more ... | undefined; } | ... 9 more ... | undefined'.
12:20:00.534 ../../packages/ui/primitives/document-flow/field-item.tsx(220,28): error TS2345: Argument of type 'unknown' is not assignable to parameter of type '{ type: "initials"; label?: string | undefined; placeholder?: string | undefined; required?: boolean | undefined; readOnly?: boolean | undefined; fontSize?: number | undefined; textAlign?: "left" | ... 2 more ... | undefined; } | ... 9 more ... | undefined'.
12:20:00.534 ../../packages/ui/primitives/document-flow/field-item.tsx(267,26): error TS2339: Property 'label' does not exist on type '{}'.
12:20:00.534 ../../packages/ui/primitives/document-flow/field-item.tsx(277,30): error TS2339: Property 'label' does not exist on type '{}'.
12:20:00.534 ../../packages/ui/primitives/document-flow/field-item.tsx(305,23): error TS2322: Type '{ [x: string]: any; formId?: unknown; nativeId?: unknown; type?: unknown; signerEmail?: unknown; recipientId?: unknown; pageNumber?: unknown; pageX?: unknown; pageY?: unknown; pageWidth?: unknown; pageHeight?: unknown; fieldMeta?: unknown; }' is not assignable to type '{ inserted?: boolean | undefined; customText?: string | undefined; type: FieldType; fieldMeta?: { type: "initials"; label?: string | undefined; placeholder?: string | undefined; required?: boolean | undefined; readOnly?: boolean | undefined; fontSize?: number | undefined; textAlign?: "left" | ... 2 more ... | undefi...'.
12:20:00.534 Property 'type' is optional in type '{ [x: string]: any; formId?: unknown; nativeId?: unknown; type?: unknown; signerEmail?: unknown; recipientId?: unknown; pageNumber?: unknown; pageX?: unknown; pageY?: unknown; pageWidth?: unknown; pageHeight?: unknown; fieldMeta?: unknown; }' but required in type '{ inserted?: boolean | undefined; customText?: string | undefined; type: FieldType; fieldMeta?: { type: "initials"; label?: string | undefined; placeholder?: string | undefined; required?: boolean | undefined; readOnly?: boolean | undefined; fontSize?: number | undefined; textAlign?: "left" | ... 2 more ... | undefi...'.
12:20:00.534 ../../packages/ui/primitives/document-flow/field-item.tsx(318,34): error TS2339: Property 'charAt' does not exist on type '{}'.
12:20:00.534 ../../packages/ui/primitives/document-flow/field-item.tsx(319,35): error TS2339: Property 'charAt' does not exist on type '{}'.
12:20:00.534 ../../packages/ui/primitives/document-flow/field-item.tsx(325,20): error TS18046: 'field.pageX' is of type 'unknown'.
12:20:00.534 ../../packages/ui/primitives/document-flow/field-item.tsx(325,50): error TS18046: 'field.pageY' is of type 'unknown'.
12:20:00.534 ../../packages/ui/primitives/document-flow/types.ts(3,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.534 ../../packages/ui/primitives/document-upload-button.tsx(5,10): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeType'.
12:20:00.534 ../../packages/ui/primitives/field-selector.tsx(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.534 ../../packages/ui/primitives/pdf-viewer/base.tsx(6,15): error TS2305: Module '"@prisma/client"' has no exported member 'EnvelopeItem'.
12:20:00.534 ../../packages/ui/primitives/recipient-role-icons.tsx(1,15): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.534 ../../packages/ui/primitives/recipient-selector.tsx(5,15): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.534 ../../packages/ui/primitives/recipient-selector.tsx(6,10): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.534 ../../packages/ui/primitives/recipient-selector.tsx(6,25): error TS2305: Module '"@prisma/client"' has no exported member 'SendStatus'.
12:20:00.534 ../../packages/ui/primitives/recipient-selector.tsx(6,37): error TS2305: Module '"@prisma/client"' has no exported member 'SigningStatus'.
12:20:00.534 ../../packages/ui/primitives/template-flow/add-template-fields.tsx(7,15): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.534 ../../packages/ui/primitives/template-flow/add-template-fields.tsx(7,22): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.534 ../../packages/ui/primitives/template-flow/add-template-fields.tsx(8,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.534 ../../packages/ui/primitives/template-flow/add-template-fields.tsx(8,21): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.534 ../../packages/ui/primitives/template-flow/add-template-fields.tsx(8,36): error TS2305: Module '"@prisma/client"' has no exported member 'SendStatus'.
12:20:00.534 ../../packages/ui/primitives/template-flow/add-template-fields.tsx(180,20): error TS18046: 'lastActiveField.pageX' is of type 'unknown'.
12:20:00.534 ../../packages/ui/primitives/template-flow/add-template-fields.tsx(181,20): error TS18046: 'lastActiveField.pageY' is of type 'unknown'.
12:20:00.534 ../../packages/ui/primitives/template-flow/add-template-fields.tsx(250,18): error TS18046: 'copiedField.pageX' is of type 'unknown'.
12:20:00.534 ../../packages/ui/primitives/template-flow/add-template-fields.tsx(251,18): error TS18046: 'copiedField.pageY' is of type 'unknown'.
12:20:00.534 ../../packages/ui/primitives/template-flow/add-template-fields.tsx(275,44): error TS2638: Type '{}' may represent a primitive value, which is not permitted as the right operand of the 'in' operator.
12:20:00.534 ../../packages/ui/primitives/template-flow/add-template-fields.tsx(276,42): error TS2339: Property 'length' does not exist on type '{}'.
12:20:00.534 ../../packages/ui/primitives/template-flow/add-template-fields.tsx(565,11): error TS2322: Type 'FieldArrayWithId<{ fields: { [x: string]: any; formId?: unknown; nativeId?: unknown; type?: unknown; signerEmail?: unknown; recipientId?: unknown; signerToken?: unknown; pageNumber?: unknown; pageX?: unknown; pageY?: unknown; pageWidth?: unknown; pageHeight?: unknown; fieldMeta?: unknown; }[]; }, "fields", "id">[]' is not assignable to type 'FieldFormType[]'.
12:20:00.534 Type 'FieldArrayWithId<{ fields: { [x: string]: any; formId?: unknown; nativeId?: unknown; type?: unknown; signerEmail?: unknown; recipientId?: unknown; signerToken?: unknown; pageNumber?: unknown; pageX?: unknown; pageY?: unknown; pageWidth?: unknown; pageHeight?: unknown; fieldMeta?: unknown; }[]; }, "fields", "id">' is not assignable to type 'FieldFormType'.
12:20:00.534 Types of property 'nativeId' are incompatible.
12:20:00.534 Type 'unknown' is not assignable to type 'number | undefined'.
12:20:00.534 ../../packages/ui/primitives/template-flow/add-template-fields.tsx(636,39): error TS2345: Argument of type 'FieldArrayWithId<{ fields: { [x: string]: any; formId?: unknown; nativeId?: unknown; type?: unknown; signerEmail?: unknown; recipientId?: unknown; signerToken?: unknown; pageNumber?: unknown; pageX?: unknown; pageY?: unknown; pageWidth?: unknown; pageHeight?: unknown; fieldMeta?: unknown; }[]; }, "fields", "id">' is not assignable to parameter of type 'SetStateAction<FieldFormType | undefined>'.
12:20:00.534 ../../packages/ui/primitives/template-flow/add-template-fields.tsx(640,61): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'SetStateAction<string | null>'.
12:20:00.534 ../../packages/ui/primitives/template-flow/add-template-fields.types.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'FieldType'.
12:20:00.534 ../../packages/ui/primitives/template-flow/add-template-placeholder-recipients.tsx(9,15): error TS2305: Module '"@prisma/client"' has no exported member 'TemplateDirectLink'.
12:20:00.534 ../../packages/ui/primitives/template-flow/add-template-placeholder-recipients.tsx(10,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSigningOrder'.
12:20:00.534 ../../packages/ui/primitives/template-flow/add-template-placeholder-recipients.tsx(10,37): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.534 ../../packages/ui/primitives/template-flow/add-template-placeholder-recipients.tsx(10,49): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.534 ../../packages/ui/primitives/template-flow/add-template-placeholder-recipients.tsx(10,60): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.534 ../../packages/ui/primitives/template-flow/add-template-placeholder-recipients.tsx(134,45): error TS7006: Parameter 'signer' implicitly has an 'any' type.
12:20:00.534 ../../packages/ui/primitives/template-flow/add-template-placeholder-recipients.tsx(157,52): error TS7006: Parameter 'signer' implicitly has an 'any' type.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-placeholder-recipients.tsx(215,14): error TS7006: Parameter 'signer' implicitly has an 'any' type.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-placeholder-recipients.tsx(233,14): error TS7006: Parameter 'a' implicitly has an 'any' type.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-placeholder-recipients.tsx(233,17): error TS7006: Parameter 'b' implicitly has an 'any' type.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-placeholder-recipients.tsx(234,13): error TS7006: Parameter 'signer' implicitly has an 'any' type.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-placeholder-recipients.tsx(234,21): error TS7006: Parameter 'index' implicitly has an 'any' type.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-placeholder-recipients.tsx(283,67): error TS2537: Type 'unknown' has no matching index signature for type 'number'.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-placeholder-recipients.tsx(302,9): error TS2698: Spread types may only be created from object types.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-placeholder-recipients.tsx(344,55): error TS7006: Parameter '*' implicitly has an 'any' type.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-placeholder-recipients.tsx(344,58): error TS7006: Parameter 'idx' implicitly has an 'any' type.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-placeholder-recipients.tsx(348,52): error TS7006: Parameter 's' implicitly has an 'any' type.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-placeholder-recipients.tsx(348,55): error TS7006: Parameter 'idx' implicitly has an 'any' type.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-placeholder-recipients.tsx(391,50): error TS7006: Parameter 'signer' implicitly has an 'any' type.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-placeholder-recipients.tsx(391,58): error TS7006: Parameter 'idx' implicitly has an 'any' type.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-placeholder-recipients.tsx(422,48): error TS7006: Parameter 'signer' implicitly has an 'any' type.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-placeholder-recipients.tsx(474,48): error TS7006: Parameter 's' implicitly has an 'any' type.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-placeholder-recipients.tsx(836,51): error TS7006: Parameter 'signer' implicitly has an 'any' type.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-placeholder-recipients.types.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentSigningOrder'.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-placeholder-recipients.types.ts(1,32): error TS2305: Module '"@prisma/client"' has no exported member 'RecipientRole'.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-placeholder-recipients.types.ts(29,21): error TS18046: 'schema.signers' is of type 'unknown'.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-placeholder-recipients.types.ts(29,41): error TS7006: Parameter 'signer' implicitly has an 'any' type.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-settings.tsx(5,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentVisibility'.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-settings.tsx(5,30): error TS2305: Module '"@prisma/client"' has no exported member 'TeamMemberRole'.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-settings.tsx(6,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentDistributionMethod'.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-settings.tsx(6,43): error TS2305: Module '"@prisma/client"' has no exported member 'Field'.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-settings.tsx(6,55): error TS2305: Module '"@prisma/client"' has no exported member 'Recipient'.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-settings.tsx(116,41): error TS2339: Property 'subject' does not exist on type '{}'.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-settings.tsx(117,41): error TS2339: Property 'message' does not exist on type '{}'.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-settings.tsx(118,42): error TS2339: Property 'timezone' does not exist on type '{}'.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-settings.tsx(120,45): error TS2339: Property 'dateFormat' does not exist on type '{}'.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-settings.tsx(123,34): error TS2339: Property 'distributionMethod' does not exist on type '{}'.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-settings.tsx(124,45): error TS2339: Property 'redirectUrl' does not exist on type '{}'.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-settings.tsx(125,42): error TS2339: Property 'language' does not exist on type '{}'.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-settings.tsx(126,41): error TS2339: Property 'emailId' does not exist on type '{}'.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-settings.tsx(127,46): error TS2339: Property 'emailReplyTo' does not exist on type '{}'.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-settings.tsx(128,83): error TS2339: Property 'emailSettings' does not exist on type '{}'.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-settings.tsx(129,54): error TS2345: Argument of type 'unknown' is not assignable to parameter of type '{ typedSignatureEnabled: boolean | null; drawSignatureEnabled: boolean | null; uploadSignatureEnabled: boolean | null; } | null | undefined'.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-settings.tsx(160,45): error TS2339: Property 'timezone' does not exist on type 'boolean'.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-settings.tsx(160,81): error TS2339: Property 'timezone' does not exist on type '{}'.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-settings.tsx(163,63): error TS2339: Property 'timezone' does not exist on type 'boolean'.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-settings.tsx(498,45): error TS2339: Property 'map' does not exist on type '{}'.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-settings.tsx(498,50): error TS7006: Parameter 'email' implicitly has an 'any' type.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-settings.types.tsx(2,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentDistributionMethod'.
12:20:00.535 ../../packages/ui/primitives/template-flow/add-template-settings.types.tsx(3,10): error TS2305: Module '"@prisma/client"' has no exported member 'DocumentVisibility'.
12:20:00.753 npm error Lifecycle script `typecheck` failed with error:
12:20:00.753 npm error code 2
12:20:00.753 npm error path /vercel/path0/apps/remix
12:20:00.753 npm error workspace @signtusk/remix@2.2.6
12:20:00.753 npm error location /vercel/path0/apps/remix
12:20:00.753 npm error command failed
12:20:00.753 npm error command sh -c react-router typegen && tsc
12:20:00.771 npm error Lifecycle script `build:app` failed with error:
12:20:00.774 npm error code 2
12:20:00.775 npm error path /vercel/path0/apps/remix
12:20:00.775 npm error workspace @signtusk/remix@2.2.6
12:20:00.775 npm error location /vercel/path0/apps/remix
12:20:00.775 npm error command failed
12:20:00.775 npm error command sh -c npm run typecheck && cross-env NODE_ENV=production react-router build
12:20:00.786 npm error Lifecycle script `build` failed with error:
12:20:00.786 npm error code 2
12:20:00.787 npm error path /vercel/path0/apps/remix
12:20:00.787 npm error workspace @signtusk/remix@2.2.6
12:20:00.787 npm error location /vercel/path0/apps/remix
12:20:00.788 npm error command failed
12:20:00.788 npm error command sh -c ./.bin/build.sh
12:20:00.802 Error: Command "npm run build" exited with 2
