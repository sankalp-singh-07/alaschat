'use client';

import {
	createSession,
	deleteSession,
	getSessions,
	updateSession,
} from '@/lib/supabaseUtils';
import React, { useEffect } from 'react';

const Example = () => {
	const user = {
		id: '123hsgefjg',
		name: 'sankalp',
	};

	const data = {
		id: '6fd7d2f2-3f58-45b0-9f7e-23699f64e8e6',
		lastMessage: 'eshf seufkh eskufh sef j',
		lastImg: 'https://xyz.com',
		title: 'Hello world',
		messageCount: 4,
		userId: user.id,
	};

	const uData = {
		lastMessage: 'sankalp singh is here',
		lastImg: 'https://abcdefghi.com',
		messageCount: 6,
	};

	useEffect(() => {
		const fetchData = async () => {
			const data = await getSessions();
			console.log(data);
		};

		const createS = async () => {
			const d = await createSession(data);
			console.log(d);
		};

		const updateS = async () => {
			const d = await updateSession(
				uData,
				'6fd7d2f2-3f58-45b0-9f7e-23699f64e8e6'
			);
			console.log(d);
		};

		const deleteS = async () => {
			const d = await deleteSession(
				'6fd7d2f2-3f58-45b0-9f7e-23699f64e8e6'
			);
			console.log(d);
		};

		fetchData();

		// createS();

		// updateS();

		deleteS();
	}, []);

	return <div>Example</div>;
};

export default Example;
