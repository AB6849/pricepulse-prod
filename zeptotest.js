import fs from "fs";
import * as cheerio from "cheerio";
import { upsertProducts } from "./src/services/productAdminService.js";

/***************************************************************
 * CONFIG
 ***************************************************************/
const PRODUCT_LINKS = [
"https://www.zepto.com/pn/pepe-jeans/pvid/62f74366-6311-4606-8a74-decd49027d52",
 "https://www.zepto.com/pn/pepe-jeans/pvid/325edb21-b432-4401-9b9c-f1fa009ca3b5",
 "https://www.zepto.com/pn/pepe-jeans/pvid/d0dc6020-f0bc-403f-88b6-4c05f588e73b",
 "https://www.zepto.com/pn/pepe-jeans/pvid/dc055ce3-6736-4a6b-8021-a284403d1521",
 "https://www.zepto.com/pn/pepe-jeans/pvid/c454d850-eec2-4cb1-a3e3-05c3e628e8f5",
 "https://www.zepto.com/pn/pepe-jeans/pvid/f3f66491-d454-40bf-ba41-f353c154c257",
 "https://www.zepto.com/pn/pepe-jeans/pvid/e72c92c5-c234-4b36-b786-ddc5cb387103",
 "https://www.zepto.com/pn/pepe-jeans/pvid/44cccbc9-646a-4562-b5fc-a8fce95a0a75",
 "https://www.zepto.com/pn/pepe-jeans/pvid/9b34b812-66fb-4830-a055-b2e71acff3a8",
 "https://www.zepto.com/pn/pepe-jeans/pvid/d480adc4-860a-44e3-b5b5-5d44ab87c3e1",
 "https://www.zepto.com/pn/pepe-jeans/pvid/527ff764-0d13-48a5-acba-9477c503319a",
 "https://www.zepto.com/pn/pepe-jeans/pvid/0f9c1d3e-8176-4b71-a141-b3c220897ea2",
 "https://www.zepto.com/pn/pepe-jeans/pvid/da370467-de31-497e-8048-dfd54b3d0b49",
 "https://www.zepto.com/pn/pepe-jeans/pvid/62363e67-b33e-4c7d-b52c-6a2c43d80e64",
 "https://www.zepto.com/pn/pepe-jeans/pvid/88f0a940-84b1-4a35-beef-44d6b3b82c8b",
 "https://www.zepto.com/pn/pepe-jeans/pvid/9b9cdd96-a49d-455f-b5c1-0c5faaa84c77",
 "https://www.zepto.com/pn/pepe-jeans/pvid/4167ec93-79ef-4d1e-94a8-79b20834bc5b",
 "https://www.zepto.com/pn/pepe-jeans/pvid/00648cee-6b5a-4470-9301-5ea1829afbda",
 "https://www.zepto.com/pn/pepe-jeans/pvid/81cc4bdb-aa64-4647-9d00-84ec39114085",
 "https://www.zepto.com/pn/pepe-jeans/pvid/c038c5d2-9116-4e36-ae9a-ce9adfc297ba",
 "https://www.zepto.com/pn/pepe-jeans/pvid/ef0bd5eb-e222-4ffc-842e-40d334e15c16",
 "https://www.zepto.com/pn/pepe-jeans/pvid/e09dd006-ddd5-46d8-be35-23751b4c8987",
 "https://www.zepto.com/pn/pepe-jeans/pvid/29d8332e-d5aa-45db-bd4f-76959d2ba9b1",
 "https://www.zepto.com/pn/pepe-jeans/pvid/19addfe2-545c-4f72-b3b8-893c1367557e",
 "https://www.zepto.com/pn/pepe-jeans/pvid/06e9111f-d2fb-4981-a86a-269cc2f7fe27",
 "https://www.zepto.com/pn/pepe-jeans/pvid/9489a607-c2ef-47be-8261-02d2ccb6afd3",
 "https://www.zepto.com/pn/pepe-jeans/pvid/f7a5cd60-3d2a-4a8e-904e-4431796faf9a",
 "https://www.zepto.com/pn/pepe-jeans/pvid/a922d34b-fd7b-4ae5-970b-d1f0da682f45",
 "https://www.zepto.com/pn/pepe-jeans/pvid/8c613ea5-969f-42f2-b2ea-cba171e9a3cc",
 "https://www.zepto.com/pn/pepe-jeans/pvid/cb919c35-3cbc-42a9-9520-2a3d2a227db4",
 "https://www.zepto.com/pn/pepe-jeans/pvid/2862e4ae-5d45-4554-a72c-e5b9bad1de64",
 "https://www.zepto.com/pn/pepe-jeans/pvid/56791fb0-7e20-41e1-bf72-79e34c4b4141",
 "https://www.zepto.com/pn/pepe-jeans/pvid/17b1f1c6-5099-4eda-b533-cf6a98843b64",
 "https://www.zepto.com/pn/pepe-jeans/pvid/e7dfb00f-e045-4331-b2c3-f0882410ce70",
 "https://www.zepto.com/pn/pepe-jeans/pvid/255b3630-f573-45b6-a0ef-cc2146cf1363",
 "https://www.zepto.com/pn/pepe-jeans/pvid/9ad111ec-b42c-48e6-bc19-ef707cb3567e",
 "https://www.zepto.com/pn/pepe-jeans/pvid/fd313883-869c-41b8-9c0d-c3dcc938bd56",
 "https://www.zepto.com/pn/pepe-jeans/pvid/d6a4a011-db3b-4291-bb89-186751fa8269",
 "https://www.zepto.com/pn/pepe-jeans/pvid/96a64c85-ff53-411b-860b-7ba2715867e2",
 "https://www.zepto.com/pn/pepe-jeans/pvid/2521d0f4-5773-430f-a75d-f970debaf661",
 "https://www.zepto.com/pn/pepe-jeans/pvid/b77ad021-8898-4d9b-b595-31e7312f6677",
 "https://www.zepto.com/pn/pepe-jeans/pvid/12175017-3bec-4167-a2b6-f2498ec2bee1",
 "https://www.zepto.com/pn/pepe-jeans/pvid/38d5e4be-f558-4071-8706-afc340307016",
 "https://www.zepto.com/pn/pepe-jeans/pvid/abcfa35c-21a6-4a6c-928b-0ce6341bc1ef",
 "https://www.zepto.com/pn/pepe-jeans/pvid/6c6f0133-783a-45db-9409-953efa0fdf3e",
 "https://www.zepto.com/pn/pepe-jeans/pvid/4dbcfdc5-b66f-4f42-adbe-a86b09de39f6",
 "https://www.zepto.com/pn/pepe-jeans/pvid/e3ff05a3-2b84-4950-86c2-30f833c89060",
 "https://www.zepto.com/pn/pepe-jeans/pvid/c2874890-12fe-4f1d-8c98-f88869b040ff",
 "https://www.zepto.com/pn/pepe-jeans/pvid/40ebee19-c9cd-4afa-8a17-463aa5d11dde",
 "https://www.zepto.com/pn/pepe-jeans/pvid/998c258a-42a7-45d3-a565-917173175b4a",
 "https://www.zepto.com/pn/pepe-jeans/pvid/2a50363b-95e0-4b1a-8b5c-c241104a33db",
 "https://www.zepto.com/pn/pepe-jeans/pvid/06d657c5-16a7-4155-8919-76a6b42415ed",
 "https://www.zepto.com/pn/pepe-jeans/pvid/1b2e6832-2f9b-4a41-9dd0-471472579ca1",
 "https://www.zepto.com/pn/pepe-jeans/pvid/421fb013-e96d-4f11-a881-b47852c8b77c",
 "https://www.zepto.com/pn/pepe-jeans/pvid/28c0471e-3736-4193-a8fe-bb1188e55d59",
 "https://www.zepto.com/pn/pepe-jeans/pvid/eec00105-0ca2-486a-9067-c6b4c61a13e7",
 "https://www.zepto.com/pn/pepe-jeans/pvid/1bc52ef6-cb4d-409c-adfc-c496ec245ba6",
 "https://www.zepto.com/pn/pepe-jeans/pvid/a01627e9-1ee1-450e-b56d-f97a6e2011ac",
 "https://www.zepto.com/pn/pepe-jeans/pvid/800c332e-6c75-4dd7-a82c-6af260b9fbe7",
 "https://www.zepto.com/pn/pepe-jeans/pvid/27324ad2-225e-47c1-a4d7-226c3ee8778f",
 "https://www.zepto.com/pn/pepe-jeans/pvid/d1bb2dcd-28c2-46b6-8c90-5fb3689b533a",
 "https://www.zepto.com/pn/pepe-jeans/pvid/39817b3a-0713-499b-8855-f15d0339b9ca",
 "https://www.zepto.com/pn/pepe-jeans/pvid/a6f09fc5-e374-4ae4-afeb-aa054d4c398f",
 "https://www.zepto.com/pn/pepe-jeans/pvid/4f77e79a-580c-44d2-9e97-d6f10e433c07",
 "https://www.zepto.com/pn/pepe-jeans/pvid/23d63d67-a89d-4ccd-95ca-e96cab6c474a",
 "https://www.zepto.com/pn/pepe-jeans/pvid/1fc71c2a-130c-49f9-a78b-8437160b123e",
 "https://www.zepto.com/pn/pepe-jeans/pvid/79866951-0e4a-4790-9035-d8826d0cd507",
 "https://www.zepto.com/pn/pepe-jeans/pvid/0fb4c6ad-8588-4c6e-ba2c-2e95ba3b5429",
 "https://www.zepto.com/pn/pepe-jeans/pvid/3f72ea71-0377-48e0-8ad8-7a5574dbb8e6",
 "https://www.zepto.com/pn/pepe-jeans/pvid/d9fbc9d1-b253-404e-b94a-918a2c738491",
 "https://www.zepto.com/pn/pepe-jeans/pvid/2826a336-1e10-433e-a397-d6e8d956e11f",
 "https://www.zepto.com/pn/pepe-jeans/pvid/e60cdf9e-cfe1-43e6-b1c0-2fde1e95d49b",
 "https://www.zepto.com/pn/pepe-jeans/pvid/0306d91d-985a-458f-92de-5f055abacc01",
 "https://www.zepto.com/pn/pepe-jeans/pvid/adf6d86f-d0e6-4cbe-a836-08d374a9838f",
 "https://www.zepto.com/pn/pepe-jeans/pvid/4945808c-eb3e-4277-821f-0438c9dc7e89",
 "https://www.zepto.com/pn/pepe-jeans/pvid/89f8ba94-2b73-4cdc-8e99-dfc27c6a3010",
 "https://www.zepto.com/pn/pepe-jeans/pvid/66d68baa-5072-4b17-9f12-03c4116dfcea",
 "https://www.zepto.com/pn/pepe-jeans/pvid/886b0090-c883-4540-82f0-5cb7905d618a",
 "https://www.zepto.com/pn/pepe-jeans/pvid/8805db4a-bd56-4bec-bd28-46082221d228",
 "https://www.zepto.com/pn/pepe-jeans/pvid/4ecf50e3-6681-4a6a-a9e8-2e7156badf69",
 "https://www.zepto.com/pn/pepe-jeans/pvid/38b30ce1-b234-4946-a7b6-5d0a4475f6b0",
 "https://www.zepto.com/pn/pepe-jeans/pvid/33c3e0e5-d470-4e0c-9314-9b0b1e77ba12",
 "https://www.zepto.com/pn/pepe-jeans/pvid/ee57813c-dc94-455f-aef4-a33c8ab45445",
 "https://www.zepto.com/pn/pepe-jeans/pvid/43544c96-9558-4fb8-bd46-196fd52fae11",
 "https://www.zepto.com/pn/pepe-jeans/pvid/1b7b3aee-5f87-4196-ac8b-690b820cb18e",
 "https://www.zepto.com/pn/pepe-jeans/pvid/63f1db85-040c-45aa-b5f1-2474937014d8",
 "https://www.zepto.com/pn/pepe-jeans/pvid/3863472d-9ac6-401f-bde7-3e299d45b5f5",
 "https://www.zepto.com/pn/pepe-jeans/pvid/8000fca0-520e-480a-9a3e-d1bdfe729ce4",
 "https://www.zepto.com/pn/pepe-jeans/pvid/c82bd0d1-2ad7-4e6e-907b-5d7faa5769f8",
 "https://www.zepto.com/pn/pepe-jeans/pvid/bc204bfa-e926-4620-ac0f-e627288a355d",
 "https://www.zepto.com/pn/pepe-jeans/pvid/5f165a80-1c7f-446f-a4e3-3db5d31078e3",
 "https://www.zepto.com/pn/pepe-jeans/pvid/e7055c84-602d-498a-8b2f-50e9c5956cb2",
 "https://www.zepto.com/pn/pepe-jeans/pvid/3d0078da-d2ce-4df9-b9ef-eb68ea7ecd00",
 "https://www.zepto.com/pn/pepe-jeans/pvid/2dbb0e23-d964-4740-ad5d-cbf2035750f0",
 "https://www.zepto.com/pn/pepe-jeans/pvid/bb7d9cf7-1a44-44f5-aef3-29c18cf90254",
 "https://www.zepto.com/pn/pepe-jeans/pvid/3f13e4cc-b1a4-4b0d-98c6-13a5e68dc4b5",
 "https://www.zepto.com/pn/pepe-jeans/pvid/5b4d4109-e4c4-45f7-b57c-fe100f2e2e86",
 "https://www.zepto.com/pn/pepe-jeans/pvid/13d53680-9501-458c-b475-793516620dcb",
 "https://www.zepto.com/pn/pepe-jeans/pvid/36166fd4-7c2d-492d-82f7-81f39f5faf6d",
 "https://www.zepto.com/pn/pepe-jeans/pvid/b682d115-9b3d-4e3f-b281-34aff25a399a",
 "https://www.zepto.com/pn/pepe-jeans/pvid/cf38a924-3dfa-4193-963f-a157a162f72e",
 "https://www.zepto.com/pn/pepe-jeans/pvid/4d0c47db-2a31-478a-b23c-74a24499b9f9",
 "https://www.zepto.com/pn/pepe-jeans/pvid/8f8b0963-ad43-4bf2-a19a-4d2c806912ef",
 "https://www.zepto.com/pn/pepe-jeans/pvid/d7068192-7cd6-4958-8a8b-ac970de786e0",
 "https://www.zepto.com/pn/pepe-jeans/pvid/81f02719-3eaf-4a50-855b-b54f2f11ce9b",
 "https://www.zepto.com/pn/pepe-jeans/pvid/618826cd-0ed6-492c-986a-0d1564f833d6",
 "https://www.zepto.com/pn/pepe-jeans/pvid/9eb92afd-3d97-4e68-ac9b-83de76303b79",
 "https://www.zepto.com/pn/pepe-jeans/pvid/f7b02c74-5569-4e71-beb3-289e0995499c",
 "https://www.zepto.com/pn/pepe-jeans/pvid/89f50c86-5840-4079-a380-d1df2751e3a1",
 "https://www.zepto.com/pn/pepe-jeans/pvid/716ff8c8-ceef-4661-b5c4-6aead2974573",
 "https://www.zepto.com/pn/pepe-jeans/pvid/88e6608e-72fc-4ea3-8a7a-79efebac0d90",
 "https://www.zepto.com/pn/pepe-jeans/pvid/ac918041-8e35-43ec-8593-75d8ecc17456",
 "https://www.zepto.com/pn/pepe-jeans/pvid/628d7221-6c97-4bfc-998b-0d1dc3e14537",
 "https://www.zepto.com/pn/pepe-jeans/pvid/ffb018d9-11c8-4d01-a137-fc31b101dd4d",
 "https://www.zepto.com/pn/pepe-jeans/pvid/162f820a-3543-4683-acbc-cec459c3dbcf",
 "https://www.zepto.com/pn/pepe-jeans/pvid/29274ffb-02db-4e31-8de3-df207246433b",
 "https://www.zepto.com/pn/pepe-jeans/pvid/49b64c76-c6b4-432d-a37f-e2ebd8d253ec",
 "https://www.zepto.com/pn/pepe-jeans/pvid/97668085-fde0-4d5b-ad35-52f373ff482e",
 "https://www.zepto.com/pn/pepe-jeans/pvid/cf17a2f5-fe25-416d-bafc-48f836bada44",
 "https://www.zepto.com/pn/pepe-jeans/pvid/257dfe08-0d51-419f-93c7-c2c2977a130c",
 "https://www.zepto.com/pn/pepe-jeans/pvid/679d3711-3171-4b02-aa10-87f89c28ad24",
 "https://www.zepto.com/pn/pepe-jeans/pvid/ae9b8ba8-37d8-4429-9cd9-24992909b750",
 "https://www.zepto.com/pn/pepe-jeans/pvid/90e713e5-abef-4b4b-8763-79758fb516f6",
 "https://www.zepto.com/pn/pepe-jeans/pvid/320f9a8c-19e9-4a1b-9046-78e815d16b0f",
 "https://www.zepto.com/pn/pepe-jeans/pvid/74e830a9-6619-4226-a8c2-9e552c159d9f",
 "https://www.zepto.com/pn/pepe-jeans/pvid/a3c61656-89cb-4772-b46d-c24930afa422",
 "https://www.zepto.com/pn/pepe-jeans/pvid/ad74fb82-fc18-44f0-809d-85ff2d498a9a",
 "https://www.zepto.com/pn/pepe-jeans/pvid/174a96f5-ceeb-4bba-9edf-92dc4da8a595",
 "https://www.zepto.com/pn/pepe-jeans/pvid/897cf0e0-7dd6-4f6d-9cdf-32d82a29190e",
 "https://www.zepto.com/pn/pepe-jeans/pvid/a14d6743-9a2d-4bf4-b7c4-48e7c157f0dc",
 "https://www.zepto.com/pn/pepe-jeans/pvid/eb55e406-2d90-4cc8-a2e3-8890b1ffaa88",
 "https://www.zepto.com/pn/pepe-jeans/pvid/e680a3ec-00a6-4e61-9651-72c24748dd67",
 "https://www.zepto.com/pn/pepe-jeans/pvid/b11cc485-1ca1-40bb-956e-6b9dbbe18d17",
 "https://www.zepto.com/pn/pepe-jeans/pvid/15ad8ddd-9441-465f-bb48-8e522b8bd069",
 "https://www.zepto.com/pn/pepe-jeans/pvid/cd433cac-e0ad-40f5-8e5d-99fff7625db2",
 "https://www.zepto.com/pn/pepe-jeans/pvid/d69c9b0c-333d-4a4b-a312-b0f2e986b771",
 "https://www.zepto.com/pn/pepe-jeans/pvid/a273fcef-081a-4659-8173-4856f565431a",
 "https://www.zepto.com/pn/pepe-jeans/pvid/a1c625e7-2078-416f-8f67-1fc081c21e67",
//  "https://www.zepto.com/pn/pepe-jeans/pvid/62a3966b-b356-4d87-aac0-ac31fb4d00ae",
 "https://www.zepto.com/pn/pepe-jeans/pvid/b94dd5f4-32b3-4c3d-839f-fc9c7eab80f3",
//  "https://www.zepto.com/pn/pepe-jeans/pvid/3b5233a8-80f3-47af-ba26-d67f85b0cb15",
 "https://www.zepto.com/pn/pepe-jeans/pvid/6e707f81-567b-4015-89bd-28b4e88f5e27",
 "https://www.zepto.com/pn/pepe-jeans/pvid/045a9023-6b5d-4866-ac53-5e63a2a73f8a",
 "https://www.zepto.com/pn/pepe-jeans/pvid/49f2f49b-3a26-463c-800f-e84c717490f9",
 "https://www.zepto.com/pn/pepe-jeans/pvid/5b3218c1-12ae-48a2-b469-b4132d429fde",
 "https://www.zepto.com/pn/pepe-jeans/pvid/958b047f-1d55-4a6a-b9d8-5c007dcf5904",
 "https://www.zepto.com/pn/pepe-jeans/pvid/ceda2a94-c263-406d-b3b3-08b2d183c2ca",
 "https://www.zepto.com/pn/pepe-jeans/pvid/03764cc0-8869-4a62-8ab2-0af4a839b87e",
 "https://www.zepto.com/pn/pepe-jeans/pvid/0cca751a-d70b-47cd-88d2-8851256370eb",
 "https://www.zepto.com/pn/pepe-jeans/pvid/38659f36-7b6e-418b-ab1a-c2c2348b5484",
 "https://www.zepto.com/pn/pepe-jeans/pvid/92c773b0-3865-4dbf-b650-4551826fccad",
 "https://www.zepto.com/pn/pepe-jeans/pvid/86e66b63-42e7-45c1-8f31-e110410f91df",
 "https://www.zepto.com/pn/pepe-jeans/pvid/a76de377-ecdd-403e-afdf-27547e8fe60f",
 "https://www.zepto.com/pn/pepe-jeans/pvid/af8be499-697f-42cf-9bb2-012943f7cf2e",
 "https://www.zepto.com/pn/pepe-jeans/pvid/b4d6e298-7259-4e07-aaaa-f9fa01e9960d",
 "https://www.zepto.com/pn/pepe-jeans/pvid/2c63968b-e005-4ccc-87cc-74042531a3a5",
 "https://www.zepto.com/pn/pepe-jeans/pvid/51fb5652-7e99-4bc8-b1eb-580267820c2d",
//  "https://www.zepto.com/pn/pepe-jeans/pvid/8219f297-db7a-418f-a345-2210a929efda",
 "https://www.zepto.com/pn/pepe-jeans/pvid/9a7eb651-8a69-4df2-8d14-e728dad433c2",
 "https://www.zepto.com/pn/pepe-jeans/pvid/12f93b0b-caac-49af-ba2a-a8825938d532",
 "https://www.zepto.com/pn/pepe-jeans/pvid/30bb2e57-bb48-452c-9816-5f12f1729411",
// "https://www.zepto.com/pn/pepe-jeans/pvid/b5dc19eb-2071-4376-bbb8-33f37208cba3",
"https://www.zepto.com/pn/pepe-jeans/pvid/d0a6ba00-9308-44d4-9650-406b4db8f5d3",
"https://www.zepto.com/pn/pepe-jeans/pvid/797e0f37-5733-4149-9971-62afca2c042d",
"https://www.zepto.com/pn/pepe-jeans/pvid/7cd36234-4263-43a7-a901-b097cf01a70f",
"https://www.zepto.com/pn/pepe-jeans/pvid/803346fd-bf2e-4422-ae8e-0a82e56dd446",
"https://www.zepto.com/pn/pepe-jeans/pvid/21da5e56-0409-41d7-9f5a-b1916938af9f",
"https://www.zepto.com/pn/pepe-jeans/pvid/a8250143-1848-4692-b5de-46300b9ae96c",
"https://www.zepto.com/pn/pepe-jeans/pvid/c02461d8-36ab-4f4d-b70f-f61d89e5e699",
"https://www.zepto.com/pn/pepe-jeans/pvid/d9dd6743-44e5-4a14-95ac-8ba21b350f5c",
"https://www.zepto.com/pn/pepe-jeans/pvid/e546a2d0-4ebc-4021-994c-8d8e6642f1bc",
"https://www.zepto.com/pn/pepe-jeans/pvid/f0d6268f-e851-4075-80c9-0fa49b6b62ac",
"https://www.zepto.com/pn/pepe-jeans/pvid/09495452-8139-4d75-b10e-88d72d5d4b7a",
// "https://www.zepto.com/pn/pepe-jeans/pvid/09ed130d-3752-4953-87be-4aec702a2b8f",
"https://www.zepto.com/pn/pepe-jeans/pvid/7ca8f22d-7313-4bd2-8d2e-76d61298e861",
// "https://www.zepto.com/pn/pepe-jeans/pvid/a8a7d918-97ac-4103-a034-87a23fb460ee",
"https://www.zepto.com/pn/pepe-jeans/pvid/cfe6246a-86fa-49d4-81b7-08cb3836b156",
"https://www.zepto.com/pn/pepe-jeans/pvid/c06e7cb1-ebe2-4a6b-a796-23637fc7d542",
"https://www.zepto.com/pn/pepe-jeans/pvid/f6b3a593-ab4e-4f3f-bff8-da4002b2ec81",
// "https://www.zepto.com/pn/pepe-jeans/pvid/86cbdf1c-375e-4063-bcd5-1d757e197e40",
"https://www.zepto.com/pn/pepe-jeans/pvid/c5e5f4f3-db07-4ca9-a9b6-2e668ac5d5ad",
// "https://www.zepto.com/pn/pepe-jeans/pvid/cd937ddd-2fb3-40c0-b1c0-f3849929ed49",
"https://www.zepto.com/pn/pepe-jeans/pvid/df73617a-b090-491e-bedc-aa125c6694d2",
"https://www.zepto.com/pn/pepe-jeans/pvid/a3b815b3-8e9b-4f7b-b614-378c542cd2c6",
"https://www.zepto.com/pn/pepe-jeans/pvid/504cbe4f-e21e-462a-a29a-6e53793a2da7",
"https://www.zepto.com/pn/pepe-jeans/pvid/0747f4d1-eae2-488d-bebe-19b61611124d",
"https://www.zepto.com/pn/pepe-jeans/pvid/998a5216-3e03-4000-ac50-72f9f4a263df",
"https://www.zepto.com/pn/pepe-jeans/pvid/a9f150e0-602a-4d3b-bf18-9df37472942f",
// "https://www.zepto.com/pn/pepe-jeans/pvid/e51b40d1-d074-4e0b-a5ec-535f2d6bb976",
"https://www.zepto.com/pn/pepe-jeans/pvid/10680361-c6ca-4702-bf7a-e32bd3eca37d",
// "https://www.zepto.com/pn/pepe-jeans/pvid/eecec0a6-35ed-448e-8373-2409b50fcc76",
"https://www.zepto.com/pn/pepe-jeans/pvid/fd8a314d-a5fb-415d-91fc-ff135bf5f52d",
"https://www.zepto.com/pn/pepe-jeans/pvid/ee6fd2e8-9db6-4dd9-a10b-0cba970ad481",
"https://www.zepto.com/pn/pepe-jeans/pvid/17d64d97-d835-4bec-b84a-e00b2b13ce8c",
"https://www.zepto.com/pn/pepe-jeans/pvid/2fc0e75b-1adf-4d41-92aa-2f316763c90e",
"https://www.zepto.com/pn/pepe-jeans/pvid/5142b42f-c5c2-4121-b629-bb58444079ba",
// "https://www.zepto.com/pn/pepe-jeans/pvid/5f704f03-59a5-434d-ac97-00d245a6d8fd",
"https://www.zepto.com/pn/pepe-jeans/pvid/e3f515d7-557a-490b-a7a6-2ca26841b748",
"https://www.zepto.com/pn/pepe-jeans/pvid/028c69e7-6a52-43c7-b705-8836c4da8eb4",
"https://www.zepto.com/pn/pepe-jeans/pvid/6400a781-13e4-4570-bc28-827701a2b71b",
"https://www.zepto.com/pn/pepe-jeans/pvid/6ebc2c95-33b2-4c24-a0c9-eb3736e2d44b",
"https://www.zepto.com/pn/pepe-jeans/pvid/7080913e-73f5-4afa-b21d-5db76f89d4fc",
"https://www.zepto.com/pn/pepe-jeans/pvid/dcb2cb52-b13c-4b03-90a5-b23d06b22fe6",
"https://www.zepto.com/pn/pepe-jeans/pvid/2fd12c68-6910-4f5c-902d-5f3e9e8172fc",
// "https://www.zepto.com/pn/pepe-jeans/pvid/6401cccd-36ba-40f7-9e23-2e556dd704a0",
"https://www.zepto.com/pn/pepe-jeans/pvid/ce0de5cf-c5b5-463d-9bdc-0edea020935b",
"https://www.zepto.com/pn/pepe-jeans/pvid/85e24b98-796a-4b64-b096-bcc2c7968c05",
// "https://www.zepto.com/pn/pepe-jeans/pvid/21ef6473-68fd-411c-85eb-b130b8799efa",
"https://www.zepto.com/pn/pepe-jeans/pvid/9536bf84-7ca8-4683-a62e-b1601b19c4e2",
// "https://www.zepto.com/pn/pepe-jeans/pvid/5340f99d-e632-4981-a9a4-07eefa7aa526",
// "https://www.zepto.com/pn/pepe-jeans/pvid/ed0fae35-5df1-4df8-95d2-9c1049d0755e",
// "https://www.zepto.com/pn/pepe-jeans/pvid/32dbcedc-d3bb-4c11-96ad-cfc20fbe0ae2",
"https://www.zepto.com/pn/pepe-jeans/pvid/dec30208-628d-438e-9e41-f0cf0231d367",
"https://www.zepto.com/pn/pepe-jeans/pvid/9ae9624f-21c0-4023-8c19-096f386a54c1",
"https://www.zepto.com/pn/pepe-jeans/pvid/090c50f0-ecd9-4dad-b7df-a1883efe7dc9",
"https://www.zepto.com/pn/pepe-jeans/pvid/6bac3a7b-35b4-4bb6-adb5-f3f0b1412b7b",
"https://www.zepto.com/pn/pepe-jeans/pvid/aef793a8-b701-433c-9b4a-8efeed3e83be",
"https://www.zepto.com/pn/pepe-jeans/pvid/0bd6fe51-3238-4bf0-a6d1-39e07c8ea155",
// "https://www.zepto.com/pn/pepe-jeans/pvid/7843a87f-1a2b-4634-abbb-eb59b5eab271",
"https://www.zepto.com/pn/pepe-jeans/pvid/786f65e0-af14-4ad0-8e8e-465fcc0fe836",
// "https://www.zepto.com/pn/pepe-jeans/pvid/a0951df7-646d-4503-8716-5491bad72adf",
"https://www.zepto.com/pn/pepe-jeans/pvid/c3f2f41b-55a2-45f3-8909-6f78fc7b5250",
"https://www.zepto.com/pn/pepe-jeans/pvid/d9bc8bfa-65a4-4daf-91f2-141550fda810",
"https://www.zepto.com/pn/pepe-jeans/pvid/1548b1fe-cf95-4eac-86d7-6eb8b667ee05",
"https://www.zepto.com/pn/pepe-jeans/pvid/cfe0f7da-3ef2-4b57-9cee-b16e954a9bc2",
"https://www.zepto.com/pn/pepe-jeans/pvid/60871996-74de-4ced-b07a-5fadc30ee157",
"https://www.zepto.com/pn/pepe-jeans/pvid/ce9340fd-4737-4d45-be2d-735008e5bbb1",
"https://www.zepto.com/pn/pepe-jeans/pvid/09675253-04cd-4795-83ab-456cd963cf89",
// "https://www.zepto.com/pn/pepe-jeans/pvid/3c14fa01-b8f4-4901-ab06-5ac80062cb36",
"https://www.zepto.com/pn/pepe-jeans/pvid/980efec7-9f1b-4ee0-a618-1b2fb3218a3e",
// "https://www.zepto.com/pn/pepe-jeans/pvid/2390af79-4f0c-4a25-9733-8c01556d4237",
// "https://www.zepto.com/pn/pepe-jeans/pvid/436b4588-823f-4337-90df-45d3bf027a61",
// "https://www.zepto.com/pn/pepe-jeans/pvid/e94a9dfc-2069-464c-9456-1f080d8d1c74",
"https://www.zepto.com/pn/pepe-jeans/pvid/1de48d69-d3cc-4910-ad14-529cc694429c",
"https://www.zepto.com/pn/pepe-jeans/pvid/e9a0b63c-cda2-476c-a2b2-7eb556830ccf",
"https://www.zepto.com/pn/pepe-jeans/pvid/f5917a2b-b90b-477e-a0a3-cc2c777be794",
"https://www.zepto.com/pn/pepe-jeans/pvid/12f034f3-d4a4-483e-a1f5-5c92c7b34c52",
// "https://www.zepto.com/pn/pepe-jeans/pvid/2ce68c53-b2b6-4a05-b9fd-29db8a4ca014",
"https://www.zepto.com/pn/pepe-jeans/pvid/3f7993fd-51af-4cfa-8534-7702bfcd3c85",
"https://www.zepto.com/pn/pepe-jeans/pvid/50379ef8-4a4a-49c0-be58-7b846e580883",
"https://www.zepto.com/pn/pepe-jeans/pvid/81b84e0d-8892-4fac-b059-d02fbddfd910",
"https://www.zepto.com/pn/pepe-jeans/pvid/b2e9c908-161e-4a99-8f31-543e76e09216",
// "https://www.zepto.com/pn/pepe-jeans/pvid/1e0fdac1-e96f-4419-9d41-7b3564abb932",
// "https://www.zepto.com/pn/pepe-jeans/pvid/830871c9-f70f-42b9-be6f-490bb21d4534",
// "https://www.zepto.com/pn/pepe-jeans/pvid/a2906883-5389-4551-a52a-99448cc7dd22",
// "https://www.zepto.com/pn/pepe-jeans/pvid/b42a7540-e3f9-426c-9245-f1cc061bb69f",
// "https://www.zepto.com/pn/pepe-jeans/pvid/d76f955f-0d86-40f6-97de-cf67b0dea043",
"https://www.zepto.com/pn/pepe-jeans/pvid/5595b563-59c1-4f85-825d-acc06a9e8a1c",
"https://www.zepto.com/pn/pepe-jeans/pvid/386aabe7-d0d4-4abd-8aca-ff00985cb043",
// "https://www.zepto.com/pn/pepe-jeans/pvid/4005eaf5-994b-42e1-95a5-0087eca12fbc",
"https://www.zepto.com/pn/pepe-jeans/pvid/466bdf5d-6ce8-47a7-9254-ab8c1c5710b4",
"https://www.zepto.com/pn/pepe-jeans/pvid/a04e094e-10bc-4a85-b70c-98c490773d65",
"https://www.zepto.com/pn/pepe-jeans/pvid/d194c78f-0d39-4486-b172-ba197d60cac3",
"https://www.zepto.com/pn/pepe-jeans/pvid/5f432450-770a-4e13-ba82-40eaf0743b22",
"https://www.zepto.com/pn/pepe-jeans/pvid/9e448fce-3ff4-4e94-8f98-ba710eb4bcfe",
// "https://www.zepto.com/pn/pepe-jeans/pvid/36bf9202-ba3d-417c-aa7e-486f0d942abc",
"https://www.zepto.com/pn/pepe-jeans/pvid/47356e60-32c7-4508-ae42-e42c006b2c75",
// "https://www.zepto.com/pn/pepe-jeans/pvid/7788360c-352d-4e43-8d4a-dae6f0708b2f",
"https://www.zepto.com/pn/pepe-jeans/pvid/e233f4a1-c5f4-445e-8a7e-6a027f1d46aa",
"https://www.zepto.com/pn/pepe-jeans/pvid/f0e28fe4-a89a-4ba6-9345-0b28db9a553e",
"https://www.zepto.com/pn/pepe-jeans/pvid/611a4337-7236-416a-8af1-f54f50e3bd02",
// "https://www.zepto.com/pn/pepe-jeans/pvid/74a3b484-97e5-48e2-9366-cc2dc9a2f427",
"https://www.zepto.com/pn/pepe-jeans/pvid/e670f6d9-777c-4e28-8d5c-a6a2498e2bec",
"https://www.zepto.com/pn/pepe-jeans/pvid/61975e1f-79eb-4954-955d-de3cd65d5ef6",
// "https://www.zepto.com/pn/pepe-jeans/pvid/d7268a84-0d0e-46c2-be78-c2db2719f4bb",
"https://www.zepto.com/pn/pepe-jeans/pvid/344e0c8a-0908-4a2b-8935-aa9a37b59c52",
"https://www.zepto.com/pn/pepe-jeans/pvid/4a5800f7-558a-4420-8958-1220a573abb6",
"https://www.zepto.com/pn/pepe-jeans/pvid/8d59f0a8-c892-4a6a-baaf-bbb20abd1010",
"https://www.zepto.com/pn/pepe-jeans/pvid/f0b170d2-c9b8-4631-8ad3-e138c10559fe",
"https://www.zepto.com/pn/pepe-jeans/pvid/f996fc6b-f815-4773-b05c-2e44e046c0b1",
// "https://www.zepto.com/pn/pepe-jeans/pvid/61995380-6135-4bed-97fc-c860bab55669",
"https://www.zepto.com/pn/pepe-jeans/pvid/c951ba4c-673a-4ac0-9a39-a798114d8f71",
// "https://www.zepto.com/pn/pepe-jeans/pvid/d594e385-efbd-4e68-a0c8-cbcc621c33f3",
"https://www.zepto.com/pn/pepe-jeans/pvid/34bff30d-49ed-4272-be57-7a1fdf367c75",
"https://www.zepto.com/pn/pepe-jeans/pvid/7bb3fca2-b3c4-4104-8e6f-84f7db7279f5",
"https://www.zepto.com/pn/pepe-jeans/pvid/be6a9097-964f-426b-b281-b94c15f1950b",
// "https://www.zepto.com/pn/pepe-jeans/pvid/bf726ea7-7ee8-475c-80cc-54179bf59856",
// "https://www.zepto.com/pn/pepe-jeans/pvid/17cb6b93-9da5-4d56-ac0c-512369adec5a",
"https://www.zepto.com/pn/pepe-jeans/pvid/33a8e73d-9070-44a0-b107-af710d01e2c1",
"https://www.zepto.com/pn/pepe-jeans/pvid/a8cb98a4-eb59-4dad-b8e3-2574948650f3",
"https://www.zepto.com/pn/pepe-jeans/pvid/9991d41b-338f-4207-98be-ead847fc5a26",
"https://www.zepto.com/pn/pepe-jeans/pvid/e765d34c-2a93-41af-a689-dcfa60c6a30a",
"https://www.zepto.com/pn/pepe-jeans/pvid/e9733286-61a1-4b6f-8896-f29fc65f0a0a",
"https://www.zepto.com/pn/pepe-jeans/pvid/fa871cdd-b6be-4101-ae74-97981da62eb1"
];

const OUTPUT_FILE = "zepto_products.csv";
const BASE_DELAY = 1800;

/***************************************************************
 * HELPERS
 ***************************************************************/
const sleep = ms => new Promise(r => setTimeout(r, ms));

function extractProductId(url) {
  return url.match(/\/pvid\/([^/?]+)/)?.[1] || "NA";
}

function extractUnit(name) {
  const match = name.match(/\((XS|S|M|L|XL|XXL)\)/i);
  return match ? match[1] : "";
}

function calculateDiscount(mrp, price) {
  if (!mrp || mrp <= price) return "";
  const pct = Math.round(((mrp - price) / mrp) * 100);
  return `${pct}% OFF`;
}

/***************************************************************
 * SUPABASE WRITER
 ***************************************************************/
async function writeToSupabase(data) {
  try {
    await upsertProducts(data, 'zepto', 'pepe');
    console.log(`✅ Wrote ${data.length} products to Supabase`);
  } catch (error) {
    console.error("Supabase error:", error.message);
    throw error;
  }
}

/***************************************************************
 * CORE SCRAPER
 ***************************************************************/
async function scrapeProduct(url) {
  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
    }
  });

  if (res.status === 429) {
  throw new Error("RATE_LIMIT");
}

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const name = $('meta[itemprop="name"]').attr("content") || "";
  const currentPrice = Number($('span[itemprop="price"]').attr("content")) || 0;

  // Best-effort MRP extraction
  let originalPrice = currentPrice;
  const bodyText = $("body").text().replace(/\s+/g, " ");

  const mrpMatch = bodyText.match(/MRP\s*₹?\s*(\d+)/i);
  if (mrpMatch) {
    originalPrice = Number(mrpMatch[1]);
  }

  const product = {
    product_id: extractProductId(url),
    url: $('link[rel="canonical"]').attr("href") || url,
    name,
    image: $('link[itemprop="image"]').attr("href") || "",
    original_price: originalPrice,
    current_price: currentPrice,
    discount: calculateDiscount(originalPrice, currentPrice),
    unit: extractUnit(name),
    in_stock: $('link[itemprop="availability"]').attr("href")?.includes("InStock")
      ? "In Stock"
      : "Out of Stock"
  };

  return product;
}

/***************************************************************
 * CSV WRITER
 ***************************************************************/
function writeCSV(rows) {
  const headers = [
    "product_id",
    "url",
    "name",
    "image",
    "original_price",
    "current_price",
    "discount",
    "unit",
    "in_stock"
  ];

  const csv = [
    headers.join(","),
    ...rows.map(r =>
      headers
        .map(h => `"${String(r[h] ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
  ].join("\n");

  fs.writeFileSync(OUTPUT_FILE, csv);
  console.log(`📁 Saved → ${OUTPUT_FILE}`);
}

/***************************************************************
 * MAIN
 ***************************************************************/
(async function run() {
  const results = [];

  for (let i = 0; i < PRODUCT_LINKS.length; i++) {
    const url = PRODUCT_LINKS[i];
    console.log(`🔗 [${i + 1}/${PRODUCT_LINKS.length}] ${url}`);

    try {
  const data = await scrapeProduct(url);
  console.log(`   ✅ ${data.name} | ₹${data.current_price}`);
  results.push(data);

} catch (e) {

  if (e.message === "RATE_LIMIT") {
    console.warn("   ⏸️  Rate limit hit. Cooling down for 10 minutes...");
    await sleep(10 * 60 * 1000); // 10 minutes
    i--; // retry same URL after cooldown
    continue;
  }

  console.error("   ❌ Failed:", e.message);
}

await sleep(BASE_DELAY + Math.random() * 1200);
  }

  writeCSV(results);
  await writeToSupabase(results);
})();
