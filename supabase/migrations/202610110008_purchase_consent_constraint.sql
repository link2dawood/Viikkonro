-- SQL CHECK permits NULL, so explicitly reject missing version/timestamp
-- whenever promotional consent is true, including service-role imports.
alter table private.commerce_purchases drop constraint explicit_marketing_consent;
alter table private.commerce_purchases add constraint explicit_marketing_consent
  check (not marketing_consent or
    (marketing_consent_version is not null and marketing_consent_at is not null
      and marketing_consent_version = 'planning-offers-fi-v1'));
