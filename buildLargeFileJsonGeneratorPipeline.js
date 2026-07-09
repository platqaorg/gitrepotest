function buildLargeFileJsonGeneratorPipeline (pipelineName, buildTag, payloadBytes) {
    const snapId = crypto.randomUUID();
    const pipeId = crypto.randomUUID();
    // A single JSON object with one large string field. Using 'a' (single-byte
    // ASCII) makes the JSON UTF-8 byte size ~= payloadBytes.
    const rows = [{ id: 1, payload: 'a'.repeat(payloadBytes) }];
    return {
        class_fqid: 'com-snaplogic-pipeline_9',
        instance_id: pipeId,
        instance_version: 1,
        link_serial: 100,
        property_map: {
            info: {
                label: { value: pipelineName },
                purpose: { value: null },
                author: { value: 'automation@snaplogic.com' },
                notes: { value: null },
            },
            input: {},
            settings: {
                error_pipeline: {},
                error_behavior: { value: 'none' },
                imports: {},
            },
        },
        snap_map: {
            [snapId]: {
                class_fqid: `com-snaplogic-snaps-transform-jsongenerator_2-${buildTag}`,
                class_id: 'com-snaplogic-snaps-transform-jsongenerator',
                class_version: 2,
                instance_fqid: `${snapId}_1`,
                instance_id: snapId,
                instance_version: 1,
                class_build_tag: buildTag,
                property_map: {
                    info: { label: { value: 'JSON Generator' }, notes: {} },
                    settings: {
                        execution_mode: { value: 'Validate & Execute' },
                        editable_content: { value: JSON.stringify(rows) },
                        arrayElementsAsDocuments: { value: true },
                    },
                    output: {
                        output0: { view_type: { value: 'document' }, label: { value: 'output0' } },
                    },
                    error: {
                        error0: { view_type: { value: 'document' }, label: { value: 'error0' } },
                        error_behavior: { value: 'fail' },
                    },
                    input: {},
                    view_serial: 100,
                },
            },
        },
        link_map: {},
        render_map: {
            scale_ratio: 1,
            pan_x_num: 0,
            pan_y_num: 0,
            detail_map: {
                [snapId]: {
                    grid_x_int: 2,
                    grid_y_int: 2,
                    rot_int: 0,
                    input: {},
                    output: {},
                    error: {},
                },
            },
        },
    };
}
