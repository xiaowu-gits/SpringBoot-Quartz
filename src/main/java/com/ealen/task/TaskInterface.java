package com.ealen.task;

import java.util.Date;

/**
 * 任务接口
 */
public interface TaskInterface {
	/**
	 * 任务被执行时，调用此方法
	 * @param param (String) 参数
	 * @param date (Date) 触发时间
	 * @param preTime (Date) 上一次触发的时间
	 * @param group (String) 分组
	 * @param name (String) 定时器名称
	 */
	public void execute(String param, Date date, Date preTime, String group, String name) ;
}
