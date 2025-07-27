// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	const __APP_CONFIG__: {
		title: string;
		description: string;
		logo: string;
		favicon: string;
		travelIndex: string;
		skeletonTheme: string;
	};

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
