/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import { DataSourcePluginOptionsEditorProps, onUpdateDatasourceJsonDataOption } from '@grafana/data';
import { DataSourceSecureJsonData, GoogleAuthType } from '@grafana/google-sdk';
import { Field, FieldSet, Input, RadioButtonGroup } from '@grafana/ui';
import { JWTConfigEditor } from './components/JWTConfigEditor';
import { JWTForm } from './components/JWTForm';
import { CloudLoggingOptions } from 'types';

type Props = DataSourcePluginOptionsEditorProps<CloudLoggingOptions, DataSourceSecureJsonData>;

const GOOGLE_AUTH_TYPE_OPTIONS = [
  { label: 'Google JWT File', value: GoogleAuthType.JWT },
  { label: 'GCE Default Service Account', value: GoogleAuthType.GCE },
];

/**
 * Config page that accepts a JWT token either through upload or pasting
 *
 * @param props JWT token fields needed by the plugin
 */
export const ConfigEditor: React.FC<Props> = (props: Props) => {
  const { options, onOptionsChange } = props;
  const { jsonData, secureJsonFields, secureJsonData } = options;

  if (!jsonData.authenticationType) {
    jsonData.authenticationType = GoogleAuthType.JWT;
  }

  const isJWT = jsonData.authenticationType === GoogleAuthType.JWT || jsonData.authenticationType === undefined;

  const onAuthTypeChange = (authenticationType: GoogleAuthType) => {
    onOptionsChange({
      ...options,
      jsonData: { ...options.jsonData, authenticationType },
    });
  };

  const hasJWTConfigured = Boolean(
    secureJsonFields &&
    secureJsonFields.privateKey &&
    jsonData.clientEmail &&
    jsonData.defaultProject &&
    jsonData.tokenUri
  );

  /**
   * Clear JWT fields
   *
   * @param jsonData Remaining data source options
   */
  const onResetJWTToken = (jsonData?: Partial<CloudLoggingOptions> | null) => {
    const nextSecureJsonData = { ...secureJsonData };
    const nextJsonData = !jsonData ? { ...options.jsonData } : { ...options.jsonData, ...jsonData };

    delete nextJsonData.clientEmail;
    delete nextJsonData.defaultProject;
    delete nextJsonData.tokenUri;
    delete nextSecureJsonData.privateKey;

    onOptionsChange({
      ...options,
      secureJsonData: nextSecureJsonData,
      jsonData: nextJsonData,
    });
  };

  const onJWTFormChange = (key: keyof CloudLoggingOptions) => onUpdateDatasourceJsonDataOption(props, key);

  return (
    <>
      <FieldSet label="Authentication">
        <Field label="Authentication type">
          <RadioButtonGroup
            options={GOOGLE_AUTH_TYPE_OPTIONS}
            value={jsonData.authenticationType || GoogleAuthType.JWT}
            onChange={onAuthTypeChange}
          />
        </Field>
      </FieldSet>

      {!isJWT && (
        <FieldSet label="Settings">
          <Field label="Default Project ID">
            {/* @ts-ignore */}
            <Input
              id="defaultProject"
              width={60}
              value={options.jsonData.defaultProject || ''}
              onChange={onJWTFormChange('defaultProject')}
            />
          </Field>
        </FieldSet>
      )}

      {isJWT && (
        <FieldSet label="JWT Key Details">
          {hasJWTConfigured ? (
            <JWTForm options={options.jsonData} onReset={onResetJWTToken} onChange={onJWTFormChange} />
          ) : (
            <JWTConfigEditor
              onChange={(jwt) => {
                onOptionsChange({
                  ...options,
                  secureJsonFields: { ...secureJsonFields, privateKey: true },
                  secureJsonData: {
                    ...secureJsonData,
                    privateKey: jwt.privateKey,
                  },
                  jsonData: {
                    ...jsonData,
                    clientEmail: jwt.clientEmail,
                    defaultProject: jwt.projectId,
                    tokenUri: jwt.tokenUri,
                  },
                });
              }}
            />
          )}{' '}
        </FieldSet>
      )}
      <Field label="Cloud Logging Service Endpoint" description="Optional">
        <Input
          id="endpoint"
          value={options.jsonData.endpoint || ''}
          onChange={onJWTFormChange('endpoint')}
        />
      </Field>
    </>
  );
};
