// Hand-written Database type mirroring supabase/migrations/20260826000001_initial_schema.sql
// Generated manually because `npx supabase gen types --local` requires a running local DB (Docker).
// Keep in sync with migration. When Docker is available, regenerate via:
//   npx supabase gen types typescript --local > src/lib/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	public: {
		Tables: {
			content: {
				Row: {
					id: string;
					type: 'film' | 'tv' | 'documentary' | 'book';
					title: string;
					cover_url: string | null;
					status: 'planned' | 'in_progress' | 'completed' | 'dropped';
					rating: number | null;
					summary: string | null;
					summary_source: 'user' | 'ai' | null;
					liked: string | null;
					disliked: string | null;
					takeaways: string | null;
					date_started: string | null;
					date_finished: string | null;
					platform: string | null;
					platform_url: string | null;
					tags: string[];
					details: Json;
					created_at: string;
				};
				Insert: {
					id?: string;
					type: 'film' | 'tv' | 'documentary' | 'book';
					title: string;
					cover_url?: string | null;
					status?: 'planned' | 'in_progress' | 'completed' | 'dropped';
					rating?: number | null;
					summary?: string | null;
					summary_source?: 'user' | 'ai' | null;
					liked?: string | null;
					disliked?: string | null;
					takeaways?: string | null;
					date_started?: string | null;
					date_finished?: string | null;
					platform?: string | null;
					platform_url?: string | null;
					tags?: string[];
					details?: Json;
					created_at?: string;
				};
				Update: {
					id?: string;
					type?: 'film' | 'tv' | 'documentary' | 'book';
					title?: string;
					cover_url?: string | null;
					status?: 'planned' | 'in_progress' | 'completed' | 'dropped';
					rating?: number | null;
					summary?: string | null;
					summary_source?: 'user' | 'ai' | null;
					liked?: string | null;
					disliked?: string | null;
					takeaways?: string | null;
					date_started?: string | null;
					date_finished?: string | null;
					platform?: string | null;
					platform_url?: string | null;
					tags?: string[];
					details?: Json;
					created_at?: string;
				};
				Relationships: [];
			};
			film_details: {
				Row: {
					content_id: string;
					director: string | null;
					story_writer: string | null;
					genre: string[] | null;
					franchise: string | null;
					cast: string[] | null;
					runtime_min: number | null;
					release_date: string | null;
				};
				Insert: {
					content_id: string;
					director?: string | null;
					story_writer?: string | null;
					genre?: string[] | null;
					franchise?: string | null;
					cast?: string[] | null;
					runtime_min?: number | null;
					release_date?: string | null;
				};
				Update: {
					content_id?: string;
					director?: string | null;
					story_writer?: string | null;
					genre?: string[] | null;
					franchise?: string | null;
					cast?: string[] | null;
					runtime_min?: number | null;
					release_date?: string | null;
				};
				Relationships: [{ foreignKeyName: string; columns: ['content_id']; isOneToOne: true; referencedRelation: 'content'; referencedColumns: ['id'] }];
			};
			tv_details: {
				Row: {
					content_id: string;
					director: string | null;
					story_writer: string | null;
					cast: string[] | null;
					seasons: number | null;
					episodes_per_season: number[] | null;
				};
				Insert: {
					content_id: string;
					director?: string | null;
					story_writer?: string | null;
					cast?: string[] | null;
					seasons?: number | null;
					episodes_per_season?: number[] | null;
				};
				Update: {
					content_id?: string;
					director?: string | null;
					story_writer?: string | null;
					cast?: string[] | null;
					seasons?: number | null;
					episodes_per_season?: number[] | null;
				};
				Relationships: [{ foreignKeyName: string; columns: ['content_id']; isOneToOne: true; referencedRelation: 'content'; referencedColumns: ['id'] }];
			};
			book_details: {
				Row: {
					content_id: string;
					author: string | null;
					publisher: string | null;
					isbn: string | null;
					page_count: number | null;
					series: string | null;
				};
				Insert: {
					content_id: string;
					author?: string | null;
					publisher?: string | null;
					isbn?: string | null;
					page_count?: number | null;
					series?: string | null;
				};
				Update: {
					content_id?: string;
					author?: string | null;
					publisher?: string | null;
					isbn?: string | null;
					page_count?: number | null;
					series?: string | null;
				};
				Relationships: [{ foreignKeyName: string; columns: ['content_id']; isOneToOne: true; referencedRelation: 'content'; referencedColumns: ['id'] }];
			};
			recommendations: {
				Row: {
					id: string;
					source_content_id: string;
					recommended_title: string;
					recommended_type: 'film' | 'tv' | 'documentary' | 'book';
					recommended_metadata: Json;
					explanation: string | null;
					score: number | null;
					dismissed: boolean | null;
					added_to_list: boolean | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					source_content_id: string;
					recommended_title: string;
					recommended_type: 'film' | 'tv' | 'documentary' | 'book';
					recommended_metadata?: Json;
					explanation?: string | null;
					score?: number | null;
					dismissed?: boolean | null;
					added_to_list?: boolean | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					source_content_id?: string;
					recommended_title?: string;
					recommended_type?: 'film' | 'tv' | 'documentary' | 'book';
					recommended_metadata?: Json;
					explanation?: string | null;
					score?: number | null;
					dismissed?: boolean | null;
					added_to_list?: boolean | null;
					created_at?: string;
				};
				Relationships: [{ foreignKeyName: string; columns: ['source_content_id']; isOneToOne: false; referencedRelation: 'content'; referencedColumns: ['id'] }];
			};
		};
		Views: { [_ in never]: never };
		Functions: { [_ in never]: never };
		Enums: {
			content_type: 'film' | 'tv' | 'documentary' | 'book';
			content_status: 'planned' | 'in_progress' | 'completed' | 'dropped';
		};
		CompositeTypes: { [_ in never]: never };
	};
};

type DefaultSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		| { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
				Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
		: never = never
> = (DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
			Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never) & {};

// Convenience helpers matching Supabase generated types
export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never
> = (DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never) & {};

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof Database },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never
> = (DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never) & {};

export type Enums<
	DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof Database },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
		: never = never
> = (DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
	? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
		? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
		: never) & {};
