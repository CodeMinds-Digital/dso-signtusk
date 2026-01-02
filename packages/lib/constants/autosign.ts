import { FieldType } from '@signtusk/lib/constants/prisma-enums';

export const AUTO_SIGNABLE_FIELD_TYPES: FieldType[] = [
  FieldType.NAME,
  FieldType.INITIALS,
  FieldType.EMAIL,
  FieldType.DATE,
];
