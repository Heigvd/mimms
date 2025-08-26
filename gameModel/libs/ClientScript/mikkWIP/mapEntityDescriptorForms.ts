/**
 * CustomForms to handle mapObjects
 */
Helpers.registerEffect(() => {
  function hideProperty(schema: any, key: string) {
    schema.properties[key].view.type = 'hidden';
  }

  function turnPropertyReadOnly(schema: any, key: string) {
    schema.properties[key].view.readOnly = true;
  }

  Schemas.addSchema('mapEntityDescriptors', (entity, schema) => {
    const objectDescriptor: IObjectDescriptor = entity as unknown as IObjectDescriptorWithId;
    if (objectDescriptor.editorTag === 'mapEntityDescriptors') {
      const newSchema = Helpers.cloneDeep(schema);

      hideProperty(newSchema, 'description');
      hideProperty(newSchema, 'defaultInstance');
      turnPropertyReadOnly(newSchema, 'editorTag');

      newSchema.properties.properties.view = {
        label: 'MapEntityDescriptor',
        type: 'dictionary',
        value: {},
        keySchema: {
          type: 'string',
          view: {
            label: 'Uid',
            layout: 'shortInline',
          },
        },
        valueSchema: {
          type: 'string',
          view: {
            type: 'serializer',
            label: 'mapEntityDescriptor',
            layout: 'shortInline',
          },
        },
      };

      return newSchema;
    }
  });
});
