export default defineAppConfig({
    ui: {
        button: {
            variants: {},
            compoundVariants: [
                {
                    color: 'primary',
                    variant: 'solid',
                    class: 'text-white',
                },
                {
                    color: 'primary',
                    variant: 'ghost',
                    class: 'text-white',
                },
            ],
        },
        colors: {
            primary: 'gray',
        },
        card: {
            variants: {
                variant: {
                    outline: {
                        root: 'p-5 divide-y-0',
                    },
                },
            },
            defaultVariants: {
                variant: 'outline',
            },
        },
        checkbox: {
            slots: {
                label: 'block font-medium text-gray-700',
            },
        },
        form: {
            base: 'grid grid-cols-7 gap-3 space-y-3',
        },
        input: {
            slots: {
                root: 'w-full',
            },
            variants: {
                variant: {
                    ghost: 'border-b-2 hover:bg-gray-200/75 focus:bg-gray-200/75',
                },
            },
        },
        navigationMenu: {
            compoundVariants: [
                {
                    disabled: false,
                    active: false,
                    class: {
                        link: 'text-white hover:text-white',
                        linkLeadingIcon: 'text-white group-hover:text-white',
                    },
                },
            ],
        },
        pageAside: {
            slots: {
                root: 'overflow-y-hidden overflow-hidden bg-gray-700 fixed left-0 z-99999 flex h-screen flex-col border-r border-gray-200 text-gray-100 transition-all duration-300 ease-in-out lg:max-h-screen lg:mt-0 lg:top-0',
            },
        },
    },
});

